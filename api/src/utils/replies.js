import { and, asc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { replies } from '../db/schema';

// Rows per insert. Kept bounded because drizzle builds the whole multi-row
// INSERT in JS — large batches blow its query builder (`Maximum call stack size
// exceeded`) long before Postgres's parameter limit.
const INSERT_BATCH_SIZE = 100;

// Read stored replies for a source's topic, oldest first (post/floor order).
// Shared by every external-reply source (v2ex, Hacker News, linux.do); `source`
// namespaces the rows in the shared `replies` table.
export const loadStoredReplies = (source, topicId) =>
	db
		.select()
		.from(replies)
		.where(and(eq(replies.source, source), eq(replies.topicId, topicId)))
		.orderBy(asc(replies.createdAt), asc(replies.replyId));

// Upsert reply rows, keyed by (source, topic_id, reply_id). On conflict,
// overwrite with the just-fetched values (Postgres `excluded` is the row that
// was proposed for insertion). Writes are chunked so drizzle's in-JS query
// builder never sees a huge batch. Pass `threaded: true` for sources that store
// a parent reference (e.g. Hacker News) so re-threading is persisted too.
export const upsertReplies = async (rows, { threaded = false } = {}) => {
	if (rows.length === 0) return;
	for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
		const chunk = rows.slice(i, i + INSERT_BATCH_SIZE);
		await db
			.insert(replies)
			.values(chunk)
			.onConflictDoUpdate({
				target: [replies.source, replies.topicId, replies.replyId],
				set: {
					...(threaded ? { parentReplyId: sql`excluded.parent_reply_id` } : {}),
					content: sql`excluded.content`,
					contentRendered: sql`excluded.content_rendered`,
					author: sql`excluded.author`,
				},
			});
	}
};
