import { and, eq } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';
import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';
import requestURL from './request';
import { loadStoredReplies, upsertReplies } from './replies';

const SOURCE = 'hn';
const MAX_COMMENTS = 2000; // safety cap on comments stored per sync

// Whether the Hacker News integration is enabled. No credentials are needed, so
// it's gated on HN_BASE_URL being set (like v2ex's token).
export const isHNEnabled = () => !!config.hn.baseUrl;

// Extract the numeric story id from a Hacker News item URL, e.g.
// https://news.ycombinator.com/item?id=123456 -> "123456"
export const getStoryId = (url) => {
	if (!url) return null;
	const match = url.match(/news\.ycombinator\.com\/item\?id=(\d+)/);
	return match ? match[1] : null;
};

// An article belongs to HN when its discussion page (the feed's <comments>
// link, stored as `commentsUrl`) is a HN item page. The article's own `url`
// points at the external story, so it can't be used here.
export const isHNArticle = (article) => !!getStoryId(article && article.commentsUrl);

const mapComment = (storyId, node, parentReplyId) => ({
	source: SOURCE,
	topicId: storyId,
	replyId: node.id,
	// Top-level comments (parent is the story itself) are stored as roots.
	parentReplyId: parentReplyId,
	// Algolia's `text` is already HTML with absolute links; keep it as both the
	// raw and rendered form so the shared replies schema/renderer just works.
	content: node.text || '',
	contentRendered: node.text || '',
	author: {
		name: node.author || '',
		// HN has no avatars; leave it blank (the UI omits the avatar when empty).
		url: node.author ? `https://news.ycombinator.com/user?id=${node.author}` : '',
		avatar: '',
	},
	// `created_at_i` is unix seconds.
	createdAt: new Date((node.created_at_i || 0) * 1000),
});

// A comment with no text is deleted or dead (HN comments always have body text;
// only the removed ones come back empty). We don't store it, but we keep its
// subtree by re-parenting its children to its own parent so the thread doesn't
// lose otherwise-visible replies.
const isDeleted = (node) => !node.text;

// Walk the Algolia comment tree depth-first into flat rows, preserving threading
// via `parentReplyId`. `parentReplyId` is null for top-level comments. Ids are
// deduped (`seen`): a malformed tree that repeats an id would otherwise put two
// rows with the same conflict key into one upsert batch, which Postgres rejects.
const flattenTree = (storyId, root) => {
	const rows = [];
	const seen = new Set();
	const visit = (node, parentReplyId) => {
		if (rows.length >= MAX_COMMENTS) return;
		const children = Array.isArray(node.children) ? node.children : [];
		// The story root itself is not a reply; only descend into it.
		const isRoot = String(node.id) === String(storyId);
		let nextParent = parentReplyId;
		if (!isRoot && !isDeleted(node) && !seen.has(node.id)) {
			seen.add(node.id);
			rows.push(mapComment(storyId, node, parentReplyId));
			nextParent = node.id;
		}
		for (const child of children) {
			if (rows.length >= MAX_COMMENTS) break;
			visit(child, nextParent);
		}
	};
	visit(root, null);
	return rows;
};

// Fetch the whole comment tree for a story from the Algolia HN API in one call.
// Uses the shared requestURL helper (HTTP/2 agent, User-Agent, timeout and proxy
// fallback).
const fetchComments = async (storyId) => {
	const res = await requestURL(`${config.hn.baseUrl}/api/v1/items/${storyId}`);
	if (!res.ok) {
		throw new Error(`hn bad status ${res.status}`);
	}
	const body = await res.json();
	if (!body || !body.id) {
		throw new Error('hn api error: empty item');
	}
	return flattenTree(storyId, body);
};

// Persist fetched comments, keyed by (source, topic_id, reply_id).
//
// Only rows that are new or whose content/parent changed are written — unchanged
// comments aren't rewritten on every TTL refresh. The whole tree is refetched
// each time, so the diff is against all stored rows. Deletions are intentionally
// not synced: rows for comments that disappeared upstream are left in place.
const saveReplies = async (storyId, items) => {
	if (items.length === 0) return;

	// Diff against what's already stored so we only write what actually changed.
	// Compare both content (edits) and parentReplyId (re-threading when an
	// ancestor is deleted), the two fields that can change for a given reply id.
	const existing = await db
		.select({
			replyId: replies.replyId,
			content: replies.content,
			parentReplyId: replies.parentReplyId,
		})
		.from(replies)
		.where(and(eq(replies.source, SOURCE), eq(replies.topicId, storyId)));
	const stored = new Map(existing.map((row) => [row.replyId, row]));

	const changed = items.filter((item) => {
		const old = stored.get(item.replyId);
		return (
			!old || old.content !== item.content || old.parentReplyId !== item.parentReplyId
		);
	});
	// `threaded` so the parent reference is persisted alongside content/author.
	await upsertReplies(changed, { threaded: true });
};

/**
 * Return the replies for an article's Hacker News story.
 *
 * Mirrors the v2ex flow: data lives in the shared `replies` table (keyed by
 * story id) and Redis holds only a per-story freshness gate with a TTL. While
 * the key is present the stored rows are served as-is; otherwise the Algolia API
 * is queried for the whole comment tree, the rows are upserted and the gate is
 * refreshed. Any failure falls through to the stored replies.
 */
export const syncHNComments = async (article) => {
	if (!isHNEnabled()) return [];

	const storyId = getStoryId(article.commentsUrl);
	if (!storyId) return [];

	// Best-effort refresh; wrapped so it can never affect the data we return.
	try {
		const freshKey = `hn:replies:fetched:${storyId}`;
		const fresh = await cache.exists(freshKey);
		if (!fresh) {
			// HN has no pagination, so the whole tree is refetched and upserted
			// each time the gate expires. The Redis TTL keeps this infrequent.
			const items = await fetchComments(storyId);
			await saveReplies(storyId, items);
			await cache.set(freshKey, Date.now(), (config.hn.ttl || 30) * 60);
		}
	} catch (err) {
		logger.warn(`Failed to refresh hn replies for story ${storyId}: ${err.message}`);
	}

	return loadStoredReplies(SOURCE, storyId);
};
