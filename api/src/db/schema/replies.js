import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// v2ex topic replies, keyed by topic id so the same topic shared across
// multiple feeds/articles stores a single set of rows. Reply data is persisted
// here; per-topic fetch freshness is tracked separately in Redis (a TTL gate).
export const replies = pgTable(
	'replies',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		topicId: text('topic_id').notNull(),
		// Provider-side reply id (v2ex `id`), used as the upsert key.
		replyId: text('reply_id').notNull(),
		content: text('content').default(''),
		contentRendered: text('content_rendered').default(''),
		author: jsonb('author').default({ name: '', url: '', avatar: '' }),
		// Reply creation time on v2ex — the API `created` field.
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		uniqueIndex('replies_topic_reply_idx').on(table.topicId, table.replyId),
		index('replies_topic_created_idx').on(table.topicId, table.createdAt),
	],
);
