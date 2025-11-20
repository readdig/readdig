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

	try {
		// Search Feeds
		const matchedFeeds = await db
			.select({
				id: feeds.id,
				title: feeds.title,
				description: feeds.description,
				images: feeds.images,
				lastScraped: feeds.lastScraped,
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
				datePublished: articles.datePublished,
				feedId: articles.feedId,
				feedTitle: feeds.title,
				feedIcon: feeds.images,
			})
			.from(articles)
			.innerJoin(feeds, eq(articles.feedId, feeds.id))
			.innerJoin(follows, eq(feeds.id, follows.feedId))
			.where(
				and(
					eq(follows.userId, userId),
					or(
						ilike(articles.title, searchPattern),
						ilike(articles.content, searchPattern),
					),
				),
			)
			.orderBy(desc(articles.datePublished))
			.limit(20);

		// Format articles to match expected structure if needed, 
        // but for now returning flat structure with feed info is good.
        // We might want to structure it like the article object in other endpoints
        // but let's keep it simple for the search view first.
        
        const formattedArticles = matchedArticles.map(article => ({
            ...article,
            feed: {
                id: article.feedId,
                title: article.feedTitle,
                images: article.feedIcon
            }
        }));

		res.json({
			feeds: matchedFeeds,
			articles: formattedArticles,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json('Error searching');
	}
};
