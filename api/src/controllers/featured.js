import { eq, or, like, desc, asc, and, sql, count } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { feeds, follows, likes, feedCategories } from '../db/schema';
import { normalizeUrl } from '../utils/urls';
import { isURL, isUUID } from '../utils/validation';
import { escapeRegexp } from '../utils/escapeRegexp';
import { getUnsafeUrls } from '../utils/blocklist';

exports.list = async (req, res) => {
	const query = req.query || {};
	const userId = req.user.sub;
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const featured = query.featured;
	const type = query.type;
	const searchText = decodeURIComponent(query.q || '').trim();
	const unsafeUrls = await getUnsafeUrls();
	const unsafeUrlsRegexp = unsafeUrls.map((url) =>
		escapeRegexp(normalizeUrl(url, { stripProtocol: true }), 'i'),
	);

	let whereConditions = [sql`${feeds.duplicateOfId} IS NULL`, eq(feeds.valid, true)];

	if (isURL(searchText)) {
		const searchUrl = normalizeUrl(searchText, { stripProtocol: true });
		whereConditions.push(
			or(
				like(lower(feeds.url), `%${searchUrl.toLowerCase()}%`),
				like(lower(feeds.feedUrl), `%${searchUrl.toLowerCase()}%`),
				sql`EXISTS (
					SELECT 1 FROM jsonb_array_elements_text(${feeds.feedUrls}) AS feed_url
					WHERE LOWER(feed_url) LIKE ${'%' + searchUrl.toLowerCase() + '%'}
				)`,
			),
		);
	} else if (isUUID(searchText)) {
		whereConditions.push(eq(feeds.id, searchText));
	} else if (searchText) {
		const searchParts = searchText
			.trim()
			.split(' ')
			.filter((s) => s)
			.map((s) => like(lower(feeds.title), `%${s.trim().toLowerCase()}%`));
		if (searchParts.length > 0) {
			whereConditions.push(or(...searchParts));
		}
	}

	if (featured === 'true') {
		whereConditions.push(eq(feeds.featured, true));
	}
	if (type) {
		whereConditions.push(eq(feeds.type, type));
	}
	const categoryId = query.categoryId;
	if (categoryId) {
		whereConditions.push(
			sql`EXISTS (
				SELECT 1 FROM feed_categories
				WHERE feed_categories.feed_id = ${feeds.id}
				AND feed_categories.category_id = ${categoryId}
			)`,
		);
	}
	if (unsafeUrlsRegexp.length) {
		const unsafeConditions = unsafeUrlsRegexp.map((url) =>
			and(
				sql`${feeds.url} NOT LIKE ${'%' + url + '%'}`,
				sql`${feeds.feedUrl} NOT LIKE ${'%' + url + '%'}`,
				sql`NOT EXISTS (
					SELECT 1 FROM jsonb_array_elements_text(${feeds.feedUrls}) AS feed_url
					WHERE feed_url LIKE ${'%' + url + '%'}
				)`,
			),
		);
		whereConditions.push(and(...unsafeConditions));
	}

	const liked = userId
		? and(eq(likes.feedId, feeds.id), eq(likes.userId, userId))
		: sql`false`;

	const data = await db
		.select({
			id: feeds.id,
			title: feeds.title,
			description: feeds.description,
			followerCount: count(follows.id).as('follower_count'),
			likes: feeds.likes,
			liked: sql`count(${likes.id}) > 0`.mapWith(Boolean),
		})
		.from(feeds)
		.leftJoin(follows, eq(follows.feedId, feeds.id))
		.leftJoin(likes, liked)
		.where(and(...whereConditions))
		.groupBy(feeds.id)
		.orderBy(
			desc(feeds.featured),
			desc(sql`follower_count`),
			desc(feeds.likes),
			asc(feeds.consecutiveScrapeFailures),
			desc(feeds.createdAt),
			asc(feeds.id),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};
