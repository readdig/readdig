import { eq, sql, count } from 'drizzle-orm';

import { db } from '../db';
import { follows, feeds, articles } from '../db/schema';

export const getFollowDetails = async (followId) => {
	const [follow] = await db
		.select({
			id: feeds.id,
			folderId: follows.folderId,
			primary: follows.primary,
			fullText: follows.fullText,
			alias: follows.alias,
			title: sql`CASE WHEN ${follows.alias} IS NOT NULL THEN ${follows.alias} ELSE ${feeds.title} END`,
			type: feeds.type,
			images: feeds.images,
			valid: feeds.valid,
			postCount: count(articles.id),
		})
		.from(follows)
		.innerJoin(feeds, eq(follows.feedId, feeds.id))
		.leftJoin(articles, eq(articles.feedId, feeds.id))
		.where(eq(follows.id, followId))
		.groupBy(follows.id, feeds.id)
		.limit(1);

	return follow;
};
