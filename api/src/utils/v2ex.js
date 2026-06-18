import { and, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';
import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';
import requestURL from './request';
import { loadStoredReplies, upsertReplies } from './replies';

const SOURCE = 'v2ex';
const PAGE_SIZE = 20; // v2ex API replies per page
const MAX_PAGES = 25; // safety cap on pages fetched per sync

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

// Fetch a single page of replies from the v2ex API v2. Uses the shared
// requestURL helper (HTTP/2 agent, User-Agent, timeout and proxy fallback); the
// v2ex API token is passed as a per-request Authorization header.
const fetchRepliesPage = async (topicId, page) => {
	const url = `${config.v2ex.baseUrl}/api/v2/topics/${topicId}/replies?p=${page}`;
	const res = await requestURL(url, {
		headers: { Authorization: `Bearer ${config.v2ex.token}` },
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

// How many replies are already stored for a topic.
const countStoredReplies = async (topicId) => {
	const [row] = await db
		.select({ count: sql`count(*)::int` })
		.from(replies)
		.where(and(eq(replies.source, SOURCE), eq(replies.topicId, topicId)));
	return row ? Number(row.count) : 0;
};

// Map fetched replies to rows and upsert them, keyed by (source, topic_id,
// reply_id). v2ex replies are append-only and overwrite-safe, so they're written
// without diffing.
const saveReplies = async (topicId, items) => {
	if (items.length === 0) return;
	const rows = items.map((item) => mapReply(topicId, item));
	await upsertReplies(rows);
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

	return loadStoredReplies(SOURCE, topicId);
};
