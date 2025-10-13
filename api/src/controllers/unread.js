import { eq, and, sql, inArray } from 'drizzle-orm';

import { db } from '../db';
import { follows, reads, articles } from '../db/schema';
import { isUUID } from '../utils/validation';

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const feedIds = req.body.feedIds || [];
	const folderIds = req.body.folderIds || [];

	// Validate that exactly one parameter is provided
	if ((!feedIds.length && !folderIds.length) || (feedIds.length && folderIds.length)) {
		return res.status(400).json({
			error: 'Either feedIds or folderIds must be provided, but not both',
		});
	}

	if (feedIds.length > 0) {
		// Mark articles from specific feeds as unread
		const validFeedIds = feedIds.filter((id) => id && isUUID(id));

		if (validFeedIds.length === 0) {
			return res.status(400).json({ error: 'No valid feed IDs provided' });
		}

		await db.insert(reads).select(
			db
				.select({
					id: sql`gen_random_uuid()`,
					userId: sql`${userId}::uuid`,
					articleId: articles.id,
					view: sql`false`,
					createdAt: sql`NOW()`,
					updatedAt: sql`NOW()`,
				})
				.from(articles)
				.leftJoin(reads, and(eq(reads.articleId, articles.id), eq(reads.userId, userId)))
				.where(and(inArray(articles.feedId, validFeedIds), sql`${reads.id} IS NULL`)),
		);
	}

	if (folderIds.length > 0) {
		// Mark articles from feeds in specified folders as unread
		const validFolderIds = folderIds.filter((id) => id && isUUID(id));

		if (validFolderIds.length === 0) {
			return res.status(400).json({ error: 'No valid folder IDs provided' });
		}

		await db.insert(reads).select(
			db
				.select({
					id: sql`gen_random_uuid()`,
					userId: sql`${userId}::uuid`,
					articleId: articles.id,
					view: sql`false`,
					createdAt: sql`NOW()`,
					updatedAt: sql`NOW()`,
				})
				.from(articles)
				.innerJoin(follows, eq(articles.feedId, follows.feedId))
				.leftJoin(reads, and(eq(reads.articleId, articles.id), eq(reads.userId, userId)))
				.where(
					and(
						eq(follows.userId, userId),
						inArray(follows.folderId, validFolderIds),
						sql`${reads.id} IS NULL`,
					),
				),
		);
	}

	res.sendStatus(204);
};
