import { fetch } from 'undici';
import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';
import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';

const SOURCE = 'v2ex';
const REQUEST_TTL = 15 * 1000;
const PAGE_SIZE = 20; // v2ex API replies per page
const MAX_PAGES = 25; // safety cap on pages fetched per sync
// Rows per insert. Kept bounded because drizzle builds the whole multi-row
// INSERT in JS — large batches blow its query builder (`Maximum call stack size
// exceeded`) long before Postgres's parameter limit.
const INSERT_BATCH_SIZE = 100;

// Whether v2ex integration is configured: both the API token and the base URL
// must be set in env.
export const isV2EXEnabled = () => !!config.v2ex.token && !!config.v2ex.baseUrl;

// Extract the numeric topic id from a v2ex topic URL, e.g.
// https://v2ex.com/t/123456#reply3 -> "123456"
export const getTopicId = (url) => {
	if (!url) return null;
	const match = url.match(/v2ex\.com\/t\/(\d+)/);
	return match ? match[1] : null;
};

// An article belongs to v2ex when its own URL is a v2ex topic page.
export const isV2EXArticle = (article) => !!getTopicId(article && article.url);

// v2ex's content_rendered uses root-relative links (e.g. /member/x, /t/123).
// Make them absolute so they resolve to v2ex, not our own domain. Leaves
// protocol-relative (//host) and already-absolute (http...) URLs untouched.
const absolutizeV2EXLinks = (html) =>
	html.replace(/\b(href|src)="\/(?!\/)/g, '$1="https://v2ex.com/');

const mapReply = (topicId, item) => ({
	source: SOURCE,
	topicId,
	replyId: item.id,
	content: item.content || '',
	contentRendered: absolutizeV2EXLinks(item.content_rendered || item.content || ''),
	author: {
		name: (item.member && item.member.username) || '',
		url:
			item.member && item.member.username
				? `https://v2ex.com/member/${item.member.username}`
				: '',
		avatar: (item.member && item.member.avatar) || '',
	},
	// `created` is unix seconds.
	createdAt: new Date((item.created || 0) * 1000),
});

// Fetch a single page of replies from the v2ex API v2.
const fetchRepliesPage = async (topicId, page) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TTL);
	try {
		const url = `${config.v2ex.baseUrl}/api/v2/topics/${topicId}/replies?p=${page}`;
		const res = await fetch(url, {
			method: 'GET',
			signal: controller.signal,
			headers: {
				Authorization: `Bearer ${config.v2ex.token}`,
				'User-Agent': config.useragent,
			},
		});

		const rate = {
			remaining: res.headers.get('x-rate-limit-remaining'),
			reset: res.headers.get('x-rate-limit-reset'),
		};

		if (res.status === 401 || res.status === 403) {
			throw new Error(`v2ex auth failed (status ${res.status})`);
		}
		if (res.status === 429) {
			throw new Error('v2ex rate limit exceeded');
		}
		if (!res.ok) {
			throw new Error(`v2ex bad status ${res.status}`);
		}

		const body = await res.json();
		if (!body || body.success === false) {
			throw new Error(`v2ex api error: ${(body && body.message) || 'unknown'}`);
		}

		return {
			result: Array.isArray(body.result) ? body.result : [],
			pagination: body.pagination,
			rate,
		};
	} finally {
		clearTimeout(timeout);
	}
};

// Fetch reply pages starting at `startPage` through the last page (from the
// API's `pagination.pages`). Replies are append-only chronological, so callers
// start at the page holding the first not-yet-stored reply to avoid
// re-downloading the whole topic. Dedupes by reply id (pages can overlap if a
// reply is posted mid-fetch) and stops if the rate-limit budget is exhausted.
const fetchRepliesFrom = async (topicId, startPage) => {
	const items = [];
	const seen = new Set();
	let pages = startPage;
	for (let page = startPage; page <= pages && page < startPage + MAX_PAGES; page++) {
		const { result, pagination, rate } = await fetchRepliesPage(topicId, page);
		if (pagination && pagination.pages) {
			pages = pagination.pages;
		}
		for (const reply of result) {
			if (!seen.has(reply.id)) {
				seen.add(reply.id);
				items.push(reply);
			}
		}

		const remaining = parseInt(rate.remaining, 10);
		if (!Number.isNaN(remaining) && remaining <= 0) {
			logger.warn(
				`v2ex rate limit reached while paging topic ${topicId}, reset at ${rate.reset}`,
			);
			break;
		}
	}
	return items;
};

// Read stored replies for a topic, oldest first (floor order).
const loadStoredReplies = (topicId) =>
	db
		.select()
		.from(replies)
		.where(and(eq(replies.source, SOURCE), eq(replies.topicId, topicId)))
		.orderBy(asc(replies.createdAt), asc(replies.replyId));

// How many replies are already stored for a topic.
const countStoredReplies = async (topicId) => {
	const [row] = await db
		.select({ count: sql`count(*)::int` })
		.from(replies)
		.where(and(eq(replies.source, SOURCE), eq(replies.topicId, topicId)));
	return row ? Number(row.count) : 0;
};

// Upsert fetched replies into the table, keyed by (topic_id, reply_id). On
// conflict, overwrite with the just-fetched values (Postgres `excluded` is the
// row that was proposed for insertion).
const saveReplies = async (topicId, items) => {
	if (items.length === 0) return;
	const rows = items.map((item) => mapReply(topicId, item));
	// Chunked so drizzle's in-JS query builder never sees a huge batch (a cold
	// load can fetch up to MAX_PAGES * PAGE_SIZE replies at once).
	for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
		const chunk = rows.slice(i, i + INSERT_BATCH_SIZE);
		await db
			.insert(replies)
			.values(chunk)
			.onConflictDoUpdate({
				target: [replies.source, replies.topicId, replies.replyId],
				set: {
					content: sql`excluded.content`,
					contentRendered: sql`excluded.content_rendered`,
					author: sql`excluded.author`,
				},
			});
	}
};

/**
 * Return the replies for an article's v2ex topic.
 *
 * Data lives in the `replies` table (keyed by topic id, shared across every
 * article that links to the topic). Redis holds only a per-topic freshness gate
 * with a TTL: while the key is present the stored rows are served as-is;
 * otherwise the API is queried, the rows are upserted and the gate is refreshed.
 */
export const syncV2EXReplies = async (article) => {
	if (!isV2EXEnabled()) return [];

	const topicId = getTopicId(article.url);
	if (!topicId) return [];

	// Best-effort refresh. Everything here — the Redis freshness gate, the API
	// fetch, the upsert — is wrapped so it can never affect the data we return:
	// on any failure we still fall through to the stored replies below.
	try {
		const freshKey = `v2ex:replies:fetched:${topicId}`;
		const fresh = await cache.exists(freshKey);
		if (!fresh) {
			// Replies are append-only, so only fetch pages that can hold ones we
			// don't have yet: the first new reply is at position storedCount+1,
			// i.e. page floor(storedCount / PAGE_SIZE) + 1. Refreshes then cost
			// ~1 page instead of re-downloading the whole topic each TTL.
			const storedCount = await countStoredReplies(topicId);
			const startPage = Math.floor(storedCount / PAGE_SIZE) + 1;
			const items = await fetchRepliesFrom(topicId, startPage);
			await saveReplies(topicId, items);
			// The freshness gate is just the key's existence; Redis TTL handles
			// expiry. The value is the fetch timestamp (epoch ms), for debugging only.
			await cache.set(freshKey, Date.now(), (config.v2ex.ttl || 30) * 60);
		}
	} catch (err) {
		logger.warn(`Failed to refresh v2ex replies for topic ${topicId}: ${err.message}`);
	}

	return loadStoredReplies(topicId);
};
