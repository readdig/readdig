import { fetch } from 'undici';
import { asc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';
import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';

const REQUEST_TTL = 15 * 1000;
const MAX_PAGES = 25;

// Whether v2ex integration is configured (API token present in env).
export const isV2EXEnabled = () => !!config.v2ex.token;

// Extract the numeric topic id from a v2ex topic URL, e.g.
// https://www.v2ex.com/t/123456#reply3 -> "123456"
export const getTopicId = (url) => {
	if (!url) return null;
	const match = url.match(/v2ex\.com\/t\/(\d+)/);
	return match ? match[1] : null;
};

// An article belongs to v2ex when its own URL is a v2ex topic page.
export const isV2EXArticle = (article) => !!getTopicId(article && article.url);

const mapReply = (topicId, item) => ({
	topicId,
	replyId: String(item.id),
	content: item.content || '',
	contentRendered: item.content_rendered || item.content || '',
	author: {
		name: (item.member && item.member.username) || '',
		url:
			item.member && item.member.username
				? `https://www.v2ex.com/member/${item.member.username}`
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

// Fetch every reply page for a topic, driven by the API's `pagination.pages`.
// Dedupes by reply id (pagination can overlap if a reply is posted mid-fetch)
// and stops if the per-IP rate-limit budget is exhausted.
const fetchAllReplies = async (topicId) => {
	const items = [];
	const seen = new Set();
	let pages = 1;
	for (let page = 1; page <= pages && page <= MAX_PAGES; page++) {
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
		.where(eq(replies.topicId, topicId))
		.orderBy(asc(replies.createdAt), asc(replies.replyId));

// Reference the conflicting insert values in an upsert (Postgres `excluded`).
function sqlExcluded(column) {
	return sql.raw(`excluded."${column}"`);
}

// Upsert fetched replies into the table, keyed by (topic_id, reply_id).
const saveReplies = async (topicId, items) => {
	if (items.length === 0) return;
	const rows = items.map((item) => mapReply(topicId, item));
	await db
		.insert(replies)
		.values(rows)
		.onConflictDoUpdate({
			target: [replies.topicId, replies.replyId],
			set: {
				content: sqlExcluded('content'),
				contentRendered: sqlExcluded('content_rendered'),
				author: sqlExcluded('author'),
			},
		});
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
	if (!config.v2ex.token) return [];

	const topicId = getTopicId(article.url);
	if (!topicId) return [];

	const freshKey = `v2ex:replies:fetched:${topicId}`;
	const fresh = await cache.get(freshKey);

	if (!fresh) {
		try {
			const items = await fetchAllReplies(topicId);
			await saveReplies(topicId, items);
			// Store an object so it round-trips through cache.get's JSON.parse
			// (raw strings would not). Presence within TTL is the freshness gate.
			await cache.set(
				freshKey,
				{ fetchedAt: new Date().toISOString() },
				(config.v2ex.ttl || 30) * 60,
			);
		} catch (err) {
			logger.warn(`Failed to fetch v2ex replies for topic ${topicId}: ${err.message}`);
		}
	}

	return loadStoredReplies(topicId);
};
