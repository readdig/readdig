import { eq, and } from 'drizzle-orm';

import { db } from '../db';
import { follows, stars, reads, listens } from '../db/schema';
import { isUUID } from '../utils/validation';
import {
	getUserArticles,
	getPrimaryArticles,
	getStarArticles,
	getReadArticles,
	getPlayedArtilces,
	getArticleById,
	getParsedArticle,
} from '../utils/articles';

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 30);
	const folderId = query.folderId;
	const feedId = query.feedId;
	const tagId = query.tagId;
	const queryType = query.type;
	const unreadOnly = query.unreadOnly;
	const endOfArticleIds = query.endOfArticleIds;
	const endOfCreatedAt = query.endOfCreatedAt;

	const queryText = query.q;

	if (queryType === 'stars' || (queryType === 'stars' && tagId)) {
		if (tagId && tagId !== 'untag' && !isUUID(tagId)) {
			return res.status(400).json(`Tag Id (${tagId}) is an invalid UUId.`);
		}
		const starArticles = await getStarArticles(
			userId,
			tagId,
			limit,
			endOfArticleIds,
			endOfCreatedAt,
			queryText,
		);
		return res.json(starArticles);
	}

	if (queryType === 'recent-read') {
		const readArticles = await getReadArticles(
			userId,
			limit,
			endOfArticleIds,
			endOfCreatedAt,
			queryText,
		);
		return res.json(readArticles);
	}

	if (queryType === 'recent-played') {
		const playedArticles = await getPlayedArtilces(
			userId,
			limit,
			endOfArticleIds,
			endOfCreatedAt,
			queryText,
		);
		return res.json(playedArticles);
	}

	if (!queryType && !folderId && !feedId) {
		const primaryArticles = await getPrimaryArticles(
			userId,
			unreadOnly,
			limit,
			endOfArticleIds,
			endOfCreatedAt,
		);
		return res.json(primaryArticles);
	}

	if (folderId && !isUUID(folderId)) {
		return res.status(400).json(`Folder Id (${folderId}) is an invalid UUId.`);
	}

	if (feedId && !isUUID(feedId)) {
		return res.status(400).json(`Feed Id (${feedId}) is an invalid UUId.`);
	}

	const articlesData = await getUserArticles(
		userId,
		folderId,
		feedId,
		unreadOnly,
		limit,
		endOfArticleIds,
		endOfCreatedAt,
	);
	res.json(articlesData);
};

exports.get = async (req, res) => {
	const userId = req.user.sub;
	const articleId = req.params.articleId;
	const articleType = req.query.type;

	if (!isUUID(articleId)) {
		return res.status(400).json(`Article Id (${articleId}) is an invalid UUId.`);
	}

	let article = await getArticleById(userId, articleId);
	if (!article) {
		return res.status(404).json('Article does not exist.');
	}

	if (!article.feed?.id) {
		return res.status(500).json('Article feed information is missing.');
	}

	const follow = await db.query.follows.findFirst({
		where: and(eq(follows.userId, userId), eq(follows.feedId, article.feed.id)),
	});

	if (article.feed.fullText || (follow && follow.fullText) || articleType === 'parsed') {
		try {
			const parsed = await getParsedArticle(article);
			if (parsed && parsed.content) {
				article.content = parsed.content;
				article.fullText = true;
				if (follow && follow.fullText) {
					article.feed.fullText = true;
				}
			}
		} catch (err) {
			if (articleType === 'parsed') {
				return res.status(400).json('Get the full text failed.');
			}
		}
	}

	if (article.unread) {
		await db
			.insert(reads)
			.values({
				userId: userId,
				articleId: articleId,
				view: true,
			})
			.onConflictDoUpdate({
				target: [reads.userId, reads.articleId],
				set: { view: true, updatedAt: new Date() },
			});
	}

	res.json(article);
};

exports.remove = async (req, res) => {
	const userId = req.user.sub;
	const articleId = req.params.articleId;
	const query = req.query || {};
	const type = query.type;

	if (!isUUID(articleId)) {
		return res.status(400).json(`Article Id (${articleId}) is an invalid UUId.`);
	}

	if (!['stars', 'recent-read', 'recent-played'].includes(type)) {
		return res.status(400).json(`Invalid type field.`);
	}

	if (type === 'stars') {
		const star = await db.query.stars.findFirst({
			where: and(eq(stars.userId, userId), eq(stars.articleId, articleId)),
		});
		if (!star) {
			return res.status(404).json('Star article does not exist.');
		}
		await db
			.delete(stars)
			.where(and(eq(stars.userId, userId), eq(stars.articleId, articleId)));
	}

	if (type === 'recent-read') {
		const read = await db.query.reads.findFirst({
			where: and(eq(reads.userId, userId), eq(reads.articleId, articleId)),
		});
		if (!read) {
			return res.status(404).json('Read article does not exist.');
		}
		await db
			.delete(reads)
			.where(and(eq(reads.userId, userId), eq(reads.articleId, articleId)));
	}

	if (type === 'recent-played') {
		const listen = await db.query.listens.findFirst({
			where: and(eq(listens.userId, userId), eq(listens.articleId, articleId)),
		});
		if (!listen) {
			return res.status(404).json('Played article does not exist.');
		}
		await db
			.delete(listens)
			.where(and(eq(listens.userId, userId), eq(listens.articleId, articleId)));
	}

	res.sendStatus(204);
};
