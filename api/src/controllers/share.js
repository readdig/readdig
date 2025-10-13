import { eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { articles, feeds } from '../db/schema';
import { getParsedArticle } from '../utils/articles';
import { logger } from '../utils/logger';

exports.get = async (req, res) => {
	const shareId = req.params.shareId;

	const [article] = await db
		.select({
			id: articles.id,
			title: articles.title,
			description: articles.description,
			content: articles.content,
			url: articles.url,
			author: articles.author,
			attachments: articles.attachments,
			type: articles.type,
			likes: articles.likes,
			views: articles.views,
			createdAt: articles.createdAt,
			updatedAt: articles.updatedAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
				url: feeds.url,
				type: feeds.type,
				fullText: feeds.fullText,
			},
		})
		.from(articles)
		.leftJoin(feeds, eq(articles.feedId, feeds.id))
		.where(eq(articles.id, shareId))
		.limit(1);

	if (!article) {
		return res.status(404).json('Article does not exist.');
	}

	if (article.feed.fullText) {
		try {
			const parsed = await getParsedArticle(article);
			if (parsed && parsed.content) {
				article.content = parsed.content;
				article.fullText = true;
			}
		} catch (err) {
			logger.warn(`Get full text, error: ${err}`);
		}
	}

	await db
		.update(articles)
		.set({
			views: sql`${articles.views} + 1`,
			updatedAt: new Date(),
		})
		.where(eq(articles.id, shareId));

	res.json(article);
};
