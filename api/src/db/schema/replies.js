import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// External topic replies, keyed by (source, topic id) so the same topic shared
// across multiple feeds/articles stores a single set of rows. `source` namespaces
// providers (currently 'v2ex', room for others later). Reply data is persisted
// here; per-topic fetch freshness is tracked separately in Redis (a TTL gate).
export const replies = pgTable(
	'replies',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		source: text('source').notNull().default('v2ex'),
		topicId: text('topic_id').notNull(),
		// Provider-side reply id (e.g. v2ex `id`), used as the upsert key.
		replyId: text('reply_id').notNull(),
		content: text('content').default(''),
		contentRendered: text('content_rendered').default(''),
		author: jsonb('author').default({ name: '', url: '', avatar: '' }),
		// Reply creation time at the source — e.g. the v2ex API `created` field.
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		uniqueIndex('replies_source_topic_reply_idx').on(
			table.source,
			table.topicId,
			table.replyId,
		),
		index('replies_source_topic_created_idx').on(
			table.source,
			table.topicId,
			table.createdAt,
		),
	],
);
