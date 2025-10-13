import { eq, or, desc, asc, like } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { articles, feeds } from '../db/schema';
import { isURL, isUUID } from '../utils/validation';
import { normalizeUrl } from '../utils/urls';

exports.list = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'createdAt,-1').split(',');
	const searchText = decodeURIComponent(query.q || '').trim();

	let orderBy = desc(articles.createdAt);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && articles[sortKey]) {
			orderBy = sortValue === 1 ? asc(articles[sortKey]) : desc(articles[sortKey]);
		}
	}

	let whereConditions = [];
	if (isURL(searchText)) {
		const searchUrl = normalizeUrl(searchText, { stripProtocol: true });
		whereConditions.push(like(lower(articles.url), `%${searchUrl.toLowerCase()}%`));
	} else if (isUUID(searchText)) {
		whereConditions.push(
			or(eq(articles.id, searchText), eq(articles.feedId, searchText)),
		);
	} else if (searchText) {
		const searchWords = searchText
			.trim()
			.split(' ')
			.filter((s) => s)
			.map((word) => like(lower(articles.title), `%${word.toLowerCase()}%`));

		if (searchWords.length > 0) {
			whereConditions.push(or(...searchWords));
		}
	}

	const data = await db
		.select({
			id: articles.id,
			title: articles.title,
			author: articles.author,
			likes: articles.likes,
			views: articles.views,
			createdAt: articles.createdAt,
			updatedAt: articles.updatedAt,
			feed: {
				id: feeds.id,
				title: feeds.title,
			},
		})
		.from(articles)
		.innerJoin(feeds, eq(articles.feedId, feeds.id))
		.where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset);

	res.json(data);
};
