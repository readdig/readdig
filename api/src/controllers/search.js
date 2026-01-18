import { ilike, or, and, eq, desc, asc, sql, like, count } from 'drizzle-orm';
import { db } from '../db';
import { lower } from '../db/lower';
import { feeds, articles, follows, stars, reads, listens, likes } from '../db/schema';
import { filterArticles } from '../utils/filters';
import { normalizeUrl } from '../utils/urls';
import { isURL, isUUID } from '../utils/validation';
import { FEED_WEIGHTS, ARTICLE_WEIGHTS } from '../utils/weights';

exports.get = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query.q;
	const type = req.query.type;
	const limit = parseInt(req.query.per_page || 20);
	const page = parseInt(req.query.page || 1);
	const offset = (page - 1) * limit;

	// Handle feeds search
	if (type === 'feeds') {
		if (!query) {
			return res.json({ feeds: [] });
		}

		const searchText = query.trim();
		const categoryId = req.query.categoryId;
		let whereConditions = [sql`${feeds.duplicateOfId} IS NULL`, eq(feeds.valid, true)];

		// Add category filter if provided
		if (categoryId) {
			whereConditions.push(
				sql`EXISTS (
					SELECT 1 FROM feed_categories
					WHERE feed_categories.feed_id = ${feeds.id}
					AND feed_categories.category_id = ${categoryId}
				)`,
			);
		}

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
		} else {
			const searchParts = searchText
				.split(' ')
				.filter((s) => s)
				.map((s) => like(lower(feeds.title), `%${s.trim().toLowerCase()}%`));
			if (searchParts.length > 0) {
				whereConditions.push(or(...searchParts));
			}
		}

		const liked = userId
			? and(eq(likes.feedId, feeds.id), eq(likes.userId, userId))
			: sql`false`;

		const matchedFeeds = await db
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

		return res.json({ feeds: matchedFeeds });
	}

	// For default search, require query
	if (!type && !query) {
		return res.json({ articles: [] });
	}

	const searchPattern = query ? `%${query}%` : null;
	const searchCondition = searchPattern
		? or(ilike(articles.title, searchPattern), ilike(articles.content, searchPattern))
		: null;

	// Filter out duplicate articles
	const notDuplicateCondition = sql`${articles.duplicateOfId} IS NULL`;

	const selectFields = {
		id: articles.id,
		url: articles.url,
		title: articles.title,
		description: articles.description,
		attachments: articles.attachments,
		type: articles.type,
		createdAt: articles.createdAt,
		feed: {
			id: feeds.id,
			title: feeds.title,
			type: feeds.type,
			feedUrl: feeds.feedUrl,
		},
	};

	let matchedArticles = [];

	if (type === 'stars') {
		const whereConditions = [eq(stars.userId, userId), notDuplicateCondition];
		if (searchCondition) whereConditions.push(searchCondition);

		matchedArticles = await db
			.select(selectFields)
			.from(stars)
			.leftJoin(articles, eq(stars.articleId, articles.id))
			.leftJoin(feeds, eq(articles.feedId, feeds.id))
			.where(and(...whereConditions))
			.orderBy(desc(stars.createdAt))
			.limit(limit)
			.offset(offset);
	} else if (type === 'recent-read') {
		const whereConditions = [
			eq(reads.userId, userId),
			eq(reads.view, true),
			notDuplicateCondition,
		];
		if (searchCondition) whereConditions.push(searchCondition);

		matchedArticles = await db
			.select(selectFields)
			.from(reads)
			.leftJoin(articles, eq(reads.articleId, articles.id))
			.leftJoin(feeds, eq(articles.feedId, feeds.id))
			.where(and(...whereConditions))
			.orderBy(desc(reads.createdAt))
			.limit(limit)
			.offset(offset);
	} else if (type === 'recent-played') {
		const whereConditions = [eq(listens.userId, userId), notDuplicateCondition];
		if (searchCondition) whereConditions.push(searchCondition);

		matchedArticles = await db
			.select(selectFields)
			.from(listens)
			.leftJoin(articles, eq(listens.articleId, articles.id))
			.leftJoin(feeds, eq(articles.feedId, feeds.id))
			.where(and(...whereConditions))
			.orderBy(desc(listens.createdAt))
			.limit(limit)
			.offset(offset);
	} else {
		// Default: search in user's followed articles
		const whereConditions = [eq(follows.userId, userId), notDuplicateCondition];
		if (searchCondition) whereConditions.push(searchCondition);

		matchedArticles = await db
			.select({
				...selectFields,
				content: articles.content,
			})
			.from(articles)
			.innerJoin(feeds, eq(articles.feedId, feeds.id))
			.innerJoin(follows, eq(feeds.id, follows.feedId))
			.where(and(...whereConditions))
			.orderBy(
				desc(sql`
					(${sql.raw(String(ARTICLE_WEIGHTS.BASE))} +
					(COALESCE(${articles.likes}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.LIKE))}) +
					(COALESCE(${articles.views}, 0) * ${sql.raw(String(ARTICLE_WEIGHTS.VIEW))})) /
					POWER(GREATEST((EXTRACT(EPOCH FROM (NOW() - ${
						articles.createdAt
					})) / 3600), 0) + 2, ${sql.raw(String(ARTICLE_WEIGHTS.GRAVITY))})
				`),
			)
			.limit(limit)
			.offset(offset);
	}

	res.json({ articles: filterArticles(matchedArticles) });
};
