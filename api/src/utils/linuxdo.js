import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';
import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';
import requestURL from './request';
import sleep from './sleep';
import { loadStoredReplies, upsertReplies } from './replies';

const SOURCE = 'linuxdo';
const PAGE_SIZE = 20; // posts per page in Discourse's topic JSON
// Pages fetched per sync. Kept modest: the sync runs inline in the article
// request, and linux.do rate-limits bursts, so big topics fill in over several
// (TTL-gated) refreshes rather than one long blocking fetch.
const MAX_PAGES = 10;
// Delay between page requests to avoid tripping linux.do's burst rate limit.
const REQUEST_DELAY_MS = 200;
// When a sync is cut short by a rate limit, re-arm the freshness gate after just
// this many minutes (instead of the full TTL) so paging resumes soon.
const RATE_LIMIT_RETRY_MINUTES = 2;
// Avatar size requested when expanding the `{size}` placeholder in a Discourse
// avatar_template (e.g. /user_avatar/linux.do/neo/{size}/12_2.png).
const AVATAR_SIZE = 90;
// The opening post (post_number 1) is the topic body — i.e. the article itself.
// It's excluded so the replies list holds only actual replies.
const OP_POST_NUMBER = 1;

// Whether the linux.do integration is enabled. linux.do is a public Discourse
// forum needing no credentials, so it's gated on LINUXDO_BASE_URL being set
// (like Hacker News). The base URL is used only to enable the feature; the topic
// JSON is fetched from each article's own canonical URL (see getTopicUrl).
export const isLinuxDOEnabled = () => !!config.linuxdo.baseUrl;

// Extract the numeric topic id from a linux.do topic URL, e.g.
// https://linux.do/t/topic/1355933 -> "1355933". Tolerates a missing slug and a
// trailing post number/anchor (.../1355933/8, .../1355933#reply-3).
export const getTopicId = (url) => {
	if (!url) return null;
	const match = url.match(/linux\.do\/t\/(?:[^/#?]+\/)?(\d+)/);
	return match ? match[1] : null;
};

// The canonical topic URL (scheme + host + /t/{slug}/{id}) the topic JSON is
// fetched from. Discourse validates the slug against the topic, so it can't be
// reconstructed from the id alone — it's taken verbatim from the article's own
// URL. Returns null when the URL lacks the required slug segment.
export const getTopicUrl = (url) => {
	if (!url) return null;
	const match = url.match(/^(https?:\/\/[^/]*linux\.do\/t\/[^/#?]+\/\d+)/);
	return match ? match[1] : null;
};

// An article belongs to linux.do when its own URL is a linux.do topic page.
export const isLinuxDOArticle = (article) => !!getTopicId(article && article.url);

// Discourse `cooked` HTML uses root-relative links (e.g. /u/x, /uploads/...).
// Make them absolute so they resolve to linux.do, not our own domain. Leaves
// protocol-relative (//host) and already-absolute (http...) URLs untouched.
const absolutizeLinuxDOLinks = (html) =>
	html.replace(/\b(href|src)="\/(?!\/)/g, '$1="https://linux.do/');

// Whether a post body carries nothing to show (e.g. a deleted post). Such posts
// are dropped rather than stored as blank replies. A post is kept if it has any
// text or embedded media (an image-only reply is still meaningful).
const isBlankContent = (html) => {
	const text = html
		.replace(/<[^>]*>/g, '')
		.replace(/&[a-z#0-9]+;/gi, ' ')
		.trim();
	return !text && !/<(img|video|audio|iframe|svg)\b/i.test(html);
};

// Expand a Discourse avatar_template into a usable URL: fill the `{size}`
// placeholder and absolutize the (usually root-relative) path. Gravatar
// templates are already absolute, so those are left as-is apart from the size.
const avatarUrl = (template) => {
	if (!template) return '';
	const sized = template.replace('{size}', String(AVATAR_SIZE));
	return /^https?:\/\//.test(sized) ? sized : `https://linux.do${sized}`;
};

const mapPost = (topicId, post) => {
	const username = post.username || '';
	// Discourse exposes only the rendered `cooked` HTML (no raw markdown), so it's
	// stored as both forms — the shared replies schema/renderer just works. The
	// frontend sanitizer collapses the structural newlines in this HTML at render.
	const content = absolutizeLinuxDOLinks(post.cooked || '');
	return {
		source: SOURCE,
		topicId,
		// The post number is the per-topic reply id. Unique within a topic, which
		// is all the (source, topic, reply) upsert key needs — and stable across
		// the RSS/JSON sources so re-fetches update rather than duplicate.
		replyId: post.post_number,
		content,
		contentRendered: content,
		author: {
			name: username || post.name || '',
			url: username ? `https://linux.do/u/${username}` : '',
			avatar: avatarUrl(post.avatar_template),
		},
		// `created_at` is an ISO 8601 string.
		createdAt: new Date(post.created_at || 0),
	};
};

// Fetch a single page of a topic's posts from Discourse's topic JSON. The slug
// in `topicUrl` must match the topic (Discourse 403s otherwise), so the URL is
// passed through verbatim from the article and only the `.json?page=` suffix is
// appended. Uses the shared requestURL helper: its HTTP/2 agent clears
// linux.do's Cloudflare bot check (a plain HTTP/1.1 fetch is 403'd) and it falls
// back to the configured proxy when the direct request still fails.
const fetchPostsPage = async (topicUrl, page) => {
	const res = await requestURL(`${topicUrl}.json?page=${page}`);

	if (res.status === 401 || res.status === 403) {
		throw new Error(`linux.do auth failed (status ${res.status})`);
	}
	// Rate limiting is expected on big/active topics. Signal it (rather than
	// throw) so the caller can keep the pages already fetched this sync.
	if (res.status === 429) {
		return { posts: [], postsCount: 0, rateLimited: true };
	}
	if (!res.ok) {
		throw new Error(`linux.do bad status ${res.status}`);
	}

	const body = await res.json();
	const stream = body && body.post_stream;
	return {
		posts: stream && Array.isArray(stream.posts) ? stream.posts : [],
		// Total post count (including the opening post) — used to bound paging.
		postsCount: Number(body && body.posts_count) || 0,
		rateLimited: false,
	};
};

// Fetch post pages starting at `startPage` through the last page (derived from
// the topic's `posts_count`). Posts are append-only and ordered by post number,
// so callers start at the page holding the first not-yet-stored reply to avoid
// re-downloading the whole topic. The opening post (the article body) and posts
// that are empty/deleted are dropped. Dedupes by post number (pages can overlap
// when posts are added mid-fetch). On a rate limit it returns the pages fetched
// so far instead of throwing, so progress is never lost mid-paging.
const fetchRepliesFrom = async (topicId, topicUrl, startPage) => {
	const rows = [];
	const seen = new Set();
	let limited = false;
	let pages = startPage;
	for (let page = startPage; page <= pages && page < startPage + MAX_PAGES; page++) {
		// Space out requests (linux.do rate-limits bursts hard); no delay before
		// the first page so a warm single-page refresh stays fast.
		if (page > startPage) await sleep(REQUEST_DELAY_MS);

		const { posts, postsCount, rateLimited } = await fetchPostsPage(topicUrl, page);
		// Hit the rate limit mid-paging: keep what we already have. The next
		// (shortened-TTL) refresh resumes from the first not-yet-stored page.
		if (rateLimited) {
			limited = true;
			logger.warn(
				`linux.do rate limited paging topic ${topicId} at page ${page}; keeping ${rows.length} replies`,
			);
			break;
		}
		if (postsCount) {
			pages = Math.ceil(postsCount / PAGE_SIZE);
		}
		if (posts.length === 0) {
			break;
		}
		for (const post of posts) {
			// The opening post is the article body, not a reply.
			if (post.post_number === OP_POST_NUMBER) continue;
			if (seen.has(post.post_number)) continue;
			seen.add(post.post_number);
			const row = mapPost(topicId, post);
			// Drop posts that have nothing to show (deleted/empty).
			if (isBlankContent(row.content)) continue;
			rows.push(row);
		}
	}
	return { rows, rateLimited: limited };
};

// The highest stored post number for a topic (0 if none). replyId IS the post
// number, so this is the last reply we already have — used to resume paging.
// Keyed off the max (not the row count) so the opening-post offset and any
// skipped/blank posts can't stall paging on a page we've already drained.
const maxStoredPostNumber = async (topicId) => {
	const [row] = await db
		.select({ max: sql`max(${replies.replyId})` })
		.from(replies)
		.where(and(eq(replies.source, SOURCE), eq(replies.topicId, topicId)));
	return row && row.max != null ? Number(row.max) : 0;
};

// Persist fetched replies. Only rows that are new or whose content changed are
// written — an unchanged reply isn't rewritten on every refresh. The diff reads
// just the rows that could conflict (the fetched post numbers), not the whole
// topic, so it stays proportional to the fetch (paged sources pull only a few
// pages per refresh).
const saveReplies = async (topicId, rows) => {
	if (rows.length === 0) return;

	const existing = await db
		.select({ replyId: replies.replyId, content: replies.content })
		.from(replies)
		.where(
			and(
				eq(replies.source, SOURCE),
				eq(replies.topicId, topicId),
				inArray(
					replies.replyId,
					rows.map((row) => row.replyId),
				),
			),
		);
	const storedContent = new Map(existing.map((row) => [row.replyId, row.content]));

	// New row → not in the map (get returns undefined ≠ content); edited row →
	// stored content differs; unchanged row → equal, skipped.
	const changed = rows.filter((row) => storedContent.get(row.replyId) !== row.content);
	await upsertReplies(changed);
};

/**
 * Return the replies for an article's linux.do topic.
 *
 * Mirrors the v2ex flow: data lives in the shared `replies` table (keyed by
 * topic id) and Redis holds only a per-topic freshness gate with a TTL. While
 * the key is present the stored rows are served as-is; otherwise the topic JSON
 * is paged from linux.do (only the pages that can hold not-yet-stored replies),
 * the rows are upserted and the gate is refreshed. Any failure falls through to
 * the stored replies.
 */
export const syncLinuxDOReplies = async (article) => {
	if (!isLinuxDOEnabled()) return [];

	const topicId = getTopicId(article.url);
	const topicUrl = getTopicUrl(article.url);
	// Without the slug-bearing URL we can't fetch (Discourse 403s a bare id), but
	// we can still serve anything already stored.
	if (!topicId || !topicUrl) return topicId ? loadStoredReplies(SOURCE, topicId) : [];

	// Best-effort refresh. Everything here — the Redis freshness gate, the page
	// fetch, the upsert — is wrapped so it can never affect the data we return:
	// on any failure we still fall through to the stored replies below.
	try {
		const freshKey = `linuxdo:replies:fetched:${topicId}`;
		const fresh = await cache.exists(freshKey);
		if (!fresh) {
			// Posts are append-only, so resume from the page holding the first
			// not-yet-stored reply: post_number maxStored+1 lives on page
			// floor(maxStored / PAGE_SIZE) + 1. Big/rate-limited topics fill in
			// across refreshes this way without re-downloading earlier pages.
			const maxPostNumber = await maxStoredPostNumber(topicId);
			const startPage = Math.floor(maxPostNumber / PAGE_SIZE) + 1;
			const { rows, rateLimited } = await fetchRepliesFrom(topicId, topicUrl, startPage);
			await saveReplies(topicId, rows);
			// The freshness gate is just the key's existence; Redis TTL handles
			// expiry. The value is the fetch timestamp (epoch ms), for debugging only.
			// A rate-limited (incomplete) sync re-arms quickly so paging resumes.
			const ttlMinutes = rateLimited
				? RATE_LIMIT_RETRY_MINUTES
				: config.linuxdo.ttl || 30;
			await cache.set(freshKey, Date.now(), ttlMinutes * 60);
		}
	} catch (err) {
		logger.warn(
			`Failed to refresh linux.do replies for topic ${topicId}: ${err.message}`,
		);
	}

	return loadStoredReplies(SOURCE, topicId);
};
