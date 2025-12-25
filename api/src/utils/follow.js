import { eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { follows, feeds, articles, reads } from '../db/schema';

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
			unreadCount: sql`(SELECT COUNT(*)::int FROM ${articles} a WHERE a.feed_id = ${feeds.id} AND NOT EXISTS (SELECT 1 FROM ${reads} r WHERE r.article_id = a.id AND r.user_id = ${follows.userId}))`,
		})
		.from(follows)
		.innerJoin(feeds, eq(follows.feedId, feeds.id))
		.where(eq(follows.id, followId))
		.limit(1);

	return follow;
};
