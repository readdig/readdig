import {
	pgTable,
	text,
	timestamp,
	uuid,
	jsonb,
	bigint,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

// External topic replies, keyed by (source, topic id) so the same topic shared
// across multiple feeds/articles stores a single set of rows. `source` namespaces
// providers ('v2ex', 'hn', room for others later). Reply data is persisted
// here; per-topic fetch freshness is tracked separately in Redis (a TTL gate).
export const replies = pgTable(
	'replies',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		source: text('source').notNull().default('v2ex'),
		topicId: text('topic_id').notNull(),
		// Provider-side reply id (e.g. v2ex `id`), used as the upsert key.
		replyId: bigint('reply_id', { mode: 'number' }).notNull(),
		// Provider-side id of the parent reply for threaded sources (e.g. Hacker
		// News comments). Null for top-level replies and for flat sources (v2ex).
		parentReplyId: bigint('parent_reply_id', { mode: 'number' }),
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
