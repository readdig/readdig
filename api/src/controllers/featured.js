import { eq, desc, asc, and, or, sql, count } from 'drizzle-orm';

import { db } from '../db';
import { feeds, follows, likes, articles, stars, listens } from '../db/schema';
import { cache } from '../utils/cache';
import { normalizeUrl } from '../utils/urls';
import { escapeRegexp } from '../utils/escapeRegexp';
import { getUnsafeUrls } from '../utils/blocklist';
import { FEED_WEIGHTS, ARTICLE_WEIGHTS } from '../utils/weights';

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = 100;
	const categoryId = query.categoryId;
	const unsafeUrls = await getUnsafeUrls();
	const unsafeUrlsRegexp = unsafeUrls.map((url) =>
		escapeRegexp(normalizeUrl(url, { stripProtocol: true }), 'i'),
	);

	let whereConditions = [sql`${feeds.duplicateOfId} IS NULL`, eq(feeds.valid, true)];
	// If a featured feed exists for a title, hide other feeds with the same title.
	whereConditions.push(
		sql`NOT EXISTS (
			SELECT 1 FROM feeds f2
			WHERE f2.title = ${feeds.title}
			AND f2.featured = true
			AND f2.id != ${feeds.id}
		)`,
	);

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
		.limit(limit);

	res.json(data);
};

exports.articles = async (req, res) => {
	const limit = 100;
	const articlesCacheKey = 'featured:articles';

	const cachedArticles = await cache.get(articlesCacheKey);
	if (cachedArticles) {
		return res.json(cachedArticles);
	}

	const sevenDaysAgo = sql`NOW() - INTERVAL '2 days'`;

	const feedFollowsSq = db
		.select({ feedId: follows.feedId, count: sql`count(*)`.mapWith(Number).as('follows_count') })
		.from(follows)
		.groupBy(follows.feedId)
		.as('f_follows');

	const articleStarsSq = db
		.select({ articleId: stars.articleId, count: sql`count(*)`.mapWith(Number).as('stars_count') })
		.from(stars)
		.groupBy(stars.articleId)
		.as('a_stars');

	const articleListensSq = db
		.select({ articleId: listens.articleId, count: sql`count(*)`.mapWith(Number).as('listens_count') })
		.from(listens)
		.groupBy(listens.articleId)
		.as('a_listens');

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
		.innerJoin(feedFollowsSq, eq(articles.feedId, feedFollowsSq.feedId))
		.leftJoin(articleStarsSq, eq(articles.id, articleStarsSq.articleId))
		.leftJoin(articleListensSq, eq(articles.id, articleListensSq.articleId))
		.where(
			and(
				sql`${articles.duplicateOfId} IS NULL`,
				sql`${articles.createdAt} > ${sevenDaysAgo}`,
				or(
					sql`COALESCE(${articleStarsSq.count}, 0) > 0`,
					sql`COALESCE(${articleListensSq.count}, 0) > 0`,
					sql`${articles.likes} > 0`,
					sql`${articles.views} > 0`,
				),
			),
		)
		.orderBy(
			desc(sql`
				(
					${sql.raw(String(ARTICLE_WEIGHTS.BASE))} +
					(COALESCE(${articleStarsSq.count}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.SAVED))}) +
					(COALESCE(${articleListensSq.count}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.PLAYED))}) +
					(${feedFollowsSq.count} * ${sql.raw(String(ARTICLE_WEIGHTS.FOLLOWER))}) +
					(COALESCE(${articles.likes}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.LIKE))}) +
					(COALESCE(${articles.views}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.VIEW))})
				) /
				POWER(
					GREATEST((EXTRACT(EPOCH FROM (NOW() - ${articles.createdAt})) / 3600), 0) + 2,
					${sql.raw(String(ARTICLE_WEIGHTS.GRAVITY))}
				)
			`),
		)
		.limit(limit);

	await cache.set(articlesCacheKey, data);
	res.json(data);
};
