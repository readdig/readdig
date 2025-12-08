import { ilike, or, and, eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { feeds, articles, follows } from '../db/schema';

exports.get = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query.q;

	if (!query) {
		return res.json({ feeds: [], articles: [] });
	}

	const searchPattern = `%${query}%`;

	// Search Feeds
	const matchedFeeds = await db
		.select({
			id: feeds.id,
			title: feeds.title,
			description: feeds.description,
			type: feeds.type,
		})
		.from(feeds)
		.innerJoin(follows, eq(feeds.id, follows.feedId))
		.where(
			and(
				eq(follows.userId, userId),
				or(ilike(feeds.title, searchPattern), ilike(feeds.description, searchPattern)),
			),
		)
		.limit(5);

	// Search Articles
	const matchedArticles = await db
		.select({
			id: articles.id,
			title: articles.title,
			description: articles.description,
			content: articles.content,
			attachments: articles.attachments,
			type: articles.type,
			createdAt: articles.createdAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
				type: feeds.type,
			},
		})
		.from(articles)
		.innerJoin(feeds, eq(articles.feedId, feeds.id))
		.innerJoin(follows, eq(feeds.id, follows.feedId))
		.where(
			and(
				eq(follows.userId, userId),
				or(ilike(articles.title, searchPattern), ilike(articles.content, searchPattern)),
			),
		)
		.orderBy(desc(articles.datePublished))
		.limit(20);

	res.json({
		feeds: matchedFeeds,
		articles: matchedArticles,
	});
};
