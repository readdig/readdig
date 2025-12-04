import strip from 'strip';
import moment from 'moment';
import { eq, and, desc, sql, inArray, ilike, or } from 'drizzle-orm';

import { db } from '../db';
import {
	articles,
	feeds,
	follows,
	stars,
	reads,
	listens,
	tags,
	contents,
	likes,
} from '../db/schema';
import { filterArticle, filterArticles } from '../utils/filters';
import { ParseContent } from '../parsers/content';

const unreadFilter = (userId, articleId) => {
	return sql`
		CASE
			WHEN NOT EXISTS (
				SELECT 1 FROM reads
				WHERE reads.user_id = ${userId}
				AND reads.article_id = ${articleId}
			) THEN true
			ELSE false
		END
	`;
};

export const getUserArticles = async (
	userId,
	folderId,
	feedId,
	unread,
	limit = 30,
	endOfArticleIds,
	endOfCreatedAt,
) => {
	let whereConditions = [];

	if (feedId) {
		whereConditions.push(eq(articles.feedId, feedId));
	}

	if (folderId && !feedId) {
		whereConditions.push(eq(follows.userId, userId), eq(follows.folderId, folderId));
	}

	if (endOfArticleIds && endOfCreatedAt && moment(parseInt(endOfCreatedAt)).isValid()) {
		const endIds = endOfArticleIds.split(',').filter((a) => a);
		whereConditions.push(
			and(
				sql`${articles.id} NOT IN ${endIds}`,
				sql`${articles.createdAt} <= ${moment(parseInt(endOfCreatedAt)).toISOString()}`,
			),
		);
	}

	if (unread) {
		whereConditions.push(
			sql`NOT EXISTS (
				SELECT 1 FROM ${reads}
				WHERE ${reads.userId} = ${userId}
				AND ${reads.articleId} = ${articles.id}
			)`,
		);
	}

	let query = db
		.select({
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
			stared: sql`CASE WHEN stars.id IS NOT NULL THEN true ELSE false END`,
			played: sql`CASE WHEN listens.id IS NOT NULL THEN true ELSE false END`,
			unread: unread ? sql`true` : unreadFilter(userId, articles.id),
			orderedAt: sql`CAST(EXTRACT(epoch FROM ${articles.createdAt}) * 1000 AS BIGINT)`,
		})
		.from(articles)
		.leftJoin(stars, and(eq(stars.articleId, articles.id), eq(stars.userId, userId)))
		.leftJoin(
			listens,
			and(eq(listens.articleId, articles.id), eq(listens.userId, userId)),
		);

	if (folderId && !feedId) {
		query = query
			.innerJoin(follows, eq(articles.feedId, follows.feedId))
			.leftJoin(feeds, eq(articles.feedId, feeds.id));
	} else {
		query = query.leftJoin(feeds, eq(articles.feedId, feeds.id));
	}

	const articlesData = await query
		.where(and(...whereConditions))
		.orderBy(desc(articles.createdAt))
		.limit(limit);

	return filterArticles(articlesData);
};

export const getPrimaryArticles = async (
	userId,
	unread,
	limit = 30,
	endOfArticleIds,
	endOfCreatedAt,
) => {
	let whereConditions = [eq(follows.userId, userId), eq(follows.primary, true)];

	if (endOfArticleIds && endOfCreatedAt && moment(parseInt(endOfCreatedAt)).isValid()) {
		const endIds = endOfArticleIds.split(',').filter((a) => a);
		whereConditions.push(
			and(
				sql`${articles.id} NOT IN ${endIds}`,
				sql`${articles.createdAt} <= ${moment(parseInt(endOfCreatedAt)).toISOString()}`,
			),
		);
	}

	if (unread) {
		whereConditions.push(
			sql`NOT EXISTS (
				SELECT 1 FROM ${reads}
				WHERE ${reads.userId} = ${userId}
				AND ${reads.articleId} = ${articles.id}
			)`,
		);
	}

	const articlesData = await db
		.select({
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
			stared: sql`CASE WHEN stars.id IS NOT NULL THEN true ELSE false END`,
			played: sql`CASE WHEN listens.id IS NOT NULL THEN true ELSE false END`,
			unread: unread ? sql`true` : unreadFilter(userId, articles.id),
			orderedAt: sql`CAST(EXTRACT(epoch FROM ${articles.createdAt}) * 1000 AS BIGINT)`,
		})
		.from(articles)
		.innerJoin(follows, eq(articles.feedId, follows.feedId))
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(stars, and(eq(stars.articleId, articles.id), eq(stars.userId, userId)))
		.leftJoin(
			listens,
			and(eq(listens.articleId, articles.id), eq(listens.userId, userId)),
		)
		.where(and(...whereConditions))
		.orderBy(desc(articles.createdAt))
		.limit(limit);

	return filterArticles(articlesData);
};

export const getStarArticles = async (
	userId,
	tagId,
	limit = 30,
	endOfArticleIds,
	endOfCreatedAt,
	queryText,
) => {
	let starWhereConditions = [eq(stars.userId, userId)];

	if (queryText) {
		const searchPattern = `%${queryText}%`;
		starWhereConditions.push(
			or(ilike(articles.title, searchPattern), ilike(articles.content, searchPattern)),
		);
	}

	if (tagId === 'untag') {
		starWhereConditions.push(sql`jsonb_array_length(${stars.tagIds}) = 0`);
	} else if (tagId) {
		starWhereConditions.push(sql`${stars.tagIds} ? ${tagId}`);
	}

	if (endOfArticleIds && endOfCreatedAt && moment(parseInt(endOfCreatedAt)).isValid()) {
		const endIds = endOfArticleIds.split(',').filter((a) => a);
		starWhereConditions.push(
			and(
				sql`${stars.articleId} NOT IN ${endIds}`,
				sql`${stars.createdAt} <= ${moment(parseInt(endOfCreatedAt)).toISOString()}`,
			),
		);
	}

	const starArticles = await db
		.select({
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
			stared: sql`true`,
			played: sql`CASE WHEN listens.id IS NOT NULL THEN true ELSE false END`,
			unread: sql`false`,
			orderedAt: sql`CAST(EXTRACT(epoch FROM ${stars.createdAt}) * 1000 AS BIGINT)`,
		})
		.from(stars)
		.leftJoin(articles, eq(stars.articleId, articles.id))
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(
			listens,
			and(eq(listens.articleId, articles.id), eq(listens.userId, userId)),
		)
		.where(and(...starWhereConditions))
		.orderBy(desc(stars.createdAt))
		.limit(limit);

	return filterArticles(starArticles);
};

export const getReadArticles = async (
	userId,
	limit = 30,
	endOfArticleIds,
	endOfCreatedAt,
	queryText,
) => {
	let readWhereConditions = [eq(reads.userId, userId), eq(reads.view, true)];

	if (queryText) {
		const searchPattern = `%${queryText}%`;
		readWhereConditions.push(
			or(ilike(articles.title, searchPattern), ilike(articles.content, searchPattern)),
		);
	}

	if (endOfArticleIds && endOfCreatedAt && moment(parseInt(endOfCreatedAt)).isValid()) {
		const endIds = endOfArticleIds.split(',').filter((a) => a);
		readWhereConditions.push(
			and(
				sql`${reads.articleId} NOT IN ${endIds}`,
				sql`${reads.createdAt} <= ${moment(parseInt(endOfCreatedAt)).toISOString()}`,
			),
		);
	}

	const readArticles = await db
		.select({
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
			stared: sql`CASE WHEN stars.id IS NOT NULL THEN true ELSE false END`,
			played: sql`CASE WHEN listens.id IS NOT NULL THEN true ELSE false END`,
			unread: sql`false`,
			orderedAt: sql`CAST(EXTRACT(epoch FROM ${reads.createdAt}) * 1000 AS BIGINT)`,
		})
		.from(reads)
		.leftJoin(articles, eq(reads.articleId, articles.id))
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(stars, and(eq(stars.articleId, articles.id), eq(stars.userId, userId)))
		.leftJoin(
			listens,
			and(eq(listens.articleId, articles.id), eq(listens.userId, userId)),
		)
		.where(and(...readWhereConditions))
		.orderBy(desc(reads.createdAt))
		.limit(limit);

	return filterArticles(readArticles);
};

export const getPlayedArtilces = async (
	userId,
	limit = 30,
	endOfArticleIds,
	endOfCreatedAt,
	queryText,
) => {
	let listenWhereConditions = [eq(listens.userId, userId)];

	if (queryText) {
		const searchPattern = `%${queryText}%`;
		listenWhereConditions.push(
			or(ilike(articles.title, searchPattern), ilike(articles.content, searchPattern)),
		);
	}

	if (endOfArticleIds && endOfCreatedAt && moment(parseInt(endOfCreatedAt)).isValid()) {
		const endIds = endOfArticleIds.split(',').filter((a) => a);
		listenWhereConditions.push(
			and(
				sql`${listens.articleId} NOT IN ${endIds}`,
				sql`${listens.createdAt} <= ${moment(parseInt(endOfCreatedAt)).toISOString()}`,
			),
		);
	}

	const playedArticles = await db
		.select({
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
			stared: sql`CASE WHEN stars.id IS NOT NULL THEN true ELSE false END`,
			played: sql`true`,
			unread: unreadFilter(userId, articles.id),
			orderedAt: sql`CAST(EXTRACT(epoch FROM ${listens.createdAt}) * 1000 AS BIGINT)`,
		})
		.from(listens)
		.leftJoin(articles, eq(listens.articleId, articles.id))
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(stars, and(eq(stars.articleId, articles.id), eq(stars.userId, userId)))
		.where(and(...listenWhereConditions))
		.orderBy(desc(listens.createdAt))
		.limit(limit);

	return filterArticles(playedArticles);
};

export const getArticleById = async (userId, articleId) => {
	const [article] = await db
		.select({
			id: articles.id,
			url: articles.url,
			title: articles.title,
			description: articles.description,
			content: articles.content,
			author: articles.author,
			attachments: articles.attachments,
			type: articles.type,
			likes: articles.likes,
			views: articles.views,
			createdAt: articles.createdAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
				url: feeds.url,
				type: feeds.type,
				feedUrl: feeds.feedUrl,
				fullText: feeds.fullText,
			},
			stared: sql`CASE WHEN stars.id IS NOT NULL THEN true ELSE false END`,
			played: sql`CASE WHEN listens.id IS NOT NULL THEN true ELSE false END`,
			liked: sql`CASE WHEN likes.id IS NOT NULL THEN true ELSE false END`,
			unread: unreadFilter(userId, articles.id),
			stars: sql`COALESCE(${stars.tagIds}, '[]'::jsonb)`,
		})
		.from(articles)
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.leftJoin(stars, and(eq(stars.articleId, articles.id), eq(stars.userId, userId)))
		.leftJoin(
			listens,
			and(eq(listens.articleId, articles.id), eq(listens.userId, userId)),
		)
		.leftJoin(likes, and(eq(likes.articleId, articles.id), eq(likes.userId, userId)))
		.where(eq(articles.id, articleId))
		.limit(1);

	if (!article) {
		return null;
	}

	await db
		.update(articles)
		.set({
			views: sql`${articles.views} + 1`,
			updatedAt: new Date(),
		})
		.where(eq(articles.id, articleId));

	if (article.stars && article.stars.length > 0) {
		const tagIds = article.stars;
		const tagsData = await db
			.select({
				id: tags.id,
				name: tags.name,
			})
			.from(tags)
			.where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)));

		article.stars = tagsData;
	} else {
		article.stars = [];
	}

	return filterArticle(article);
};

// Parse article content using Readability
export const getParsedArticle = async (article) => {
	if (
		!article ||
		(article && !article.url) ||
		// XKCD doesn't like Readability
		(article && article.url.indexOf('https://xkcd') === 0)
	) {
		return null;
	}

	const url = article.url;
	const articleId = article.id;

	// Check if content already exists
	const existingContent = await db.query.contents.findFirst({
		where: and(eq(contents.url, url), eq(contents.articleId, articleId)),
	});

	if (existingContent) {
		return existingContent;
	}

	try {
		const parsed = await ParseContent(url);
		if (parsed) {
			const title = parsed.title;
			const content = parsed.content;
			const excerpt = strip(parsed.excerpt || '');
			const datePublished = parsed.publishedTime
				? new Date(parsed.publishedTime)
				: new Date();

			if (title && content) {
				const [newContent] = await db
					.insert(contents)
					.values({
						url,
						articleId,
						title,
						excerpt,
						content,
						datePublished,
					})
					.returning();

				return newContent;
			}
		}

		return null;
	} catch (e) {
		throw new Error(`Readability failed for ${url}: ${e.message}`);
	}
};
