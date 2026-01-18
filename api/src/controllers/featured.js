import { eq, desc, asc, and, sql, count } from 'drizzle-orm';

import { db } from '../db';
import { feeds, follows, likes, articles } from '../db/schema';
import { normalizeUrl } from '../utils/urls';
import { escapeRegexp } from '../utils/escapeRegexp';
import { getUnsafeUrls } from '../utils/blocklist';
import { FEED_WEIGHTS, ARTICLE_WEIGHTS } from '../utils/weights';

exports.list = async (req, res) => {
	const query = req.query || {};
	const userId = req.user.sub;
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const categoryId = query.categoryId;
	const unsafeUrls = await getUnsafeUrls();
	const unsafeUrlsRegexp = unsafeUrls.map((url) =>
		escapeRegexp(normalizeUrl(url, { stripProtocol: true }), 'i'),
	);

	let whereConditions = [sql`${feeds.duplicateOfId} IS NULL`, eq(feeds.valid, true)];

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
			desc(sql`
				(CASE WHEN ${feeds.featured} THEN ${FEED_WEIGHTS.FEATURED} ELSE 0 END) +
				(COUNT(${follows.id}) * ${FEED_WEIGHTS.FOLLOWER}) +
				(${feeds.likes} * ${FEED_WEIGHTS.LIKE}) -
				(${feeds.consecutiveScrapeFailures} * ${FEED_WEIGHTS.FAILURE_PENALTY}) +
				(CASE WHEN ${feeds.fullText} THEN ${FEED_WEIGHTS.FULL_TEXT} ELSE 0 END) +
				(CASE WHEN ${feeds.images}->>'featured' IS NOT NULL AND ${feeds.images}->>'featured' != '' THEN ${FEED_WEIGHTS.HAS_FEATURED_IMAGE} ELSE 0 END) +
				(CASE WHEN ${feeds.images}->>'icon' IS NOT NULL AND ${feeds.images}->>'icon' != '' THEN ${FEED_WEIGHTS.HAS_ICON} ELSE 0 END) +
				(CASE WHEN ${feeds.images}->>'og' IS NOT NULL AND ${feeds.images}->>'og' != '' THEN ${FEED_WEIGHTS.HAS_OG} ELSE 0 END)
			`),
			asc(feeds.id),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.articles = async (req, res) => {
	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;

	const data = await db
		.select({
			id: articles.id,
			title: articles.title,
			description: articles.description,
			attachments: articles.attachments,
			type: articles.type,
			likes: articles.likes,
			views: articles.views,
			createdAt: articles.createdAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
				type: feeds.type,
			},
		})
		.from(articles)
		.innerJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(follows, eq(follows.feedId, feeds.id))
		.where(
			and(
				eq(feeds.valid, true),
				sql`${feeds.duplicateOfId} IS NULL`,
				sql`${articles.createdAt} > NOW() - INTERVAL '30 days'`,
			),
		)
		.groupBy(articles.id, feeds.id)
		.orderBy(
			desc(sql`
				(${sql.raw(String(ARTICLE_WEIGHTS.BASE))} +
				(COUNT(${follows.id}) * ${sql.raw(String(ARTICLE_WEIGHTS.FOLLOWER))}) +
				(COALESCE(${articles.likes}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.LIKE))}) +
				(COALESCE(${articles.views}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.VIEW))})) /
				POWER(GREATEST((EXTRACT(EPOCH FROM (NOW() - ${
					articles.createdAt
				})) / 3600), 0) + 2, ${sql.raw(String(ARTICLE_WEIGHTS.GRAVITY))})
			`),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};
