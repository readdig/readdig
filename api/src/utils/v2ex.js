import { fetch } from 'undici';

import { config } from '../config';
import { cache } from './cache';
import { logger } from './logger';

const REQUEST_TTL = 15 * 1000;
const PAGE_SIZE = 20;
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

const mapReply = (item, index) => ({
	id: String(item.id),
	floor: index + 1,
	content: item.content || '',
	contentRendered: item.content_rendered || item.content || '',
	author: {
		name: (item.member && item.member.username) || '',
		url:
			item.member && item.member.username
				? `https://www.v2ex.com/member/${item.member.username}`
				: '',
		avatar:
			(item.member &&
				(item.member.avatar ||
					item.member.avatar_large ||
					item.member.avatar_normal ||
					item.member.avatar_mini)) ||
			'',
	},
	thanks: item.thanks || 0,
	datePublished: (item.created ? new Date(item.created * 1000) : new Date()).toISOString(),
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
			limit: res.headers.get('x-rate-limit-limit'),
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

		return { result: Array.isArray(body.result) ? body.result : [], rate };
	} finally {
		clearTimeout(timeout);
	}
};

// Fetch all reply pages for a topic. Stops on a short page, on the rate-limit
// budget running out, or when a page introduces no new replies — the v2ex API
// clamps out-of-range pages to the last page instead of returning empty, so a
// topic whose reply count is an exact multiple of PAGE_SIZE would otherwise
// loop and yield duplicate ids.
const fetchAllReplies = async (topicId) => {
	const items = [];
	const seen = new Set();
	for (let page = 1; page <= MAX_PAGES; page++) {
		const { result, rate } = await fetchRepliesPage(topicId, page);
		const fresh = result.filter((r) => !seen.has(r.id));
		fresh.forEach((r) => seen.add(r.id));
		items.push(...fresh);

		// Short page = last page; no fresh ids = clamped/duplicate page.
		if (result.length < PAGE_SIZE || fresh.length === 0) break;

		// Respect the documented rate limit: stop early when the budget is gone.
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

/**
 * Fetch v2ex topic replies for an article, cached in Redis by topic id.
 *
 * Keyed by topic (not article), so the same topic shared across multiple feeds
 * stores a single copy and is fetched at most once per TTL window. The empty
 * result is cached too, so reply-less topics don't trigger a request on every
 * open. The reply objects carry `datePublished`; the client derives the
 * "last reply" time from them.
 */
export const syncV2EXReplies = async (article) => {
	if (!config.v2ex.token) return [];

	const topicId = getTopicId(article.url);
	if (!topicId) return [];

	const key = `v2ex:replies:${topicId}`;
	const cached = await cache.get(key);
	if (cached) return cached;

	try {
		const items = await fetchAllReplies(topicId);
		const replies = items.map(mapReply);
		await cache.set(key, replies, (config.v2ex.ttl || 30) * 60);
		return replies;
	} catch (err) {
		logger.warn(`Failed to fetch v2ex replies for topic ${topicId}: ${err.message}`);
		return [];
	}
};
