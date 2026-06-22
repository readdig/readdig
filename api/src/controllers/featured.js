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
	const articlesCacheKey = 'featured:articles:7days';

	const cachedArticles = await cache.get(articlesCacheKey);
	if (cachedArticles) {
		return res.json(cachedArticles);
	}

	const recentArticles = db.$with('recent_articles').as(
		db
			.select({
				id: articles.id,
				feedId: articles.feedId,
				title: articles.title,
				description: articles.description,
				attachments: articles.attachments,
				type: articles.type,
				likes: articles.likes,
				views: articles.views,
				createdAt: articles.createdAt,
			})
			.from(articles)
			.where(
				and(
					sql`${articles.duplicateOfId} IS NULL`,
					sql`${articles.createdAt} > NOW() - INTERVAL '7 days'`,
				),
			)
	);

	const recentStars = db.$with('recent_stars').as(
		db
			.select({
				articleId: stars.articleId,
				starsCount: sql`count(*)`.mapWith(Number).as('stars_count'),
			})
			.from(stars)
			.innerJoin(recentArticles, eq(stars.articleId, recentArticles.id))
			.groupBy(stars.articleId)
	);

	const recentListens = db.$with('recent_listens').as(
		db
			.select({
				articleId: listens.articleId,
				listensCount: sql`count(*)`.mapWith(Number).as('listens_count'),
			})
			.from(listens)
			.innerJoin(recentArticles, eq(listens.articleId, recentArticles.id))
			.groupBy(listens.articleId)
	);

	const recentFeeds = db.$with('recent_feeds').as(
		db
			.select({ id: recentArticles.feedId })
			.from(recentArticles)
			.groupBy(recentArticles.feedId)
	);

	const feedFollows = db.$with('feed_follows').as(
		db
			.select({
				feedId: follows.feedId,
				followsCount: sql`count(*)`.mapWith(Number).as('follows_count'),
			})
			.from(follows)
			.innerJoin(recentFeeds, eq(follows.feedId, recentFeeds.id))
			.groupBy(follows.feedId)
	);

	const data = await db
		.with(recentArticles, recentStars, recentListens, recentFeeds, feedFollows)
		.select({
			id: recentArticles.id,
			title: recentArticles.title,
			description: recentArticles.description,
			attachments: recentArticles.attachments,
			type: recentArticles.type,
			likes: recentArticles.likes,
			views: recentArticles.views,
			createdAt: recentArticles.createdAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
				type: feeds.type,
			},
		})
		.from(recentArticles)
		.innerJoin(feeds, eq(recentArticles.feedId, feeds.id))
		.leftJoin(recentStars, eq(recentArticles.id, recentStars.articleId))
		.leftJoin(recentListens, eq(recentArticles.id, recentListens.articleId))
		.innerJoin(feedFollows, eq(recentArticles.feedId, feedFollows.feedId))
		.where(
			or(
				sql`COALESCE(${recentStars.starsCount}, 0) > 0`,
				sql`COALESCE(${recentListens.listensCount}, 0) > 0`,
				sql`${recentArticles.likes} > 0`,
				sql`${recentArticles.views} > 0`,
			),
		)
		.orderBy(
			desc(sql`
				(
					${sql.raw(String(ARTICLE_WEIGHTS.BASE))} +
					(COALESCE(${recentStars.starsCount}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.SAVED))}) +
					(COALESCE(${recentListens.listensCount}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.PLAYED))}) +
					(${feedFollows.followsCount} * ${sql.raw(String(ARTICLE_WEIGHTS.FOLLOWER))}) +
					(COALESCE(${recentArticles.likes}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.LIKE))}) +
					(COALESCE(${recentArticles.views}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.VIEW))})
				) /
				POWER(
					GREATEST((EXTRACT(EPOCH FROM (NOW() - ${recentArticles.createdAt})) / 3600), 0) + 2,
					${sql.raw(String(ARTICLE_WEIGHTS.GRAVITY))}
				)
			`),
		)
		.limit(limit);

	await cache.set(articlesCacheKey, data);
	res.json(data);
};
