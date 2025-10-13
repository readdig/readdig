import {
	pgTable,
	timestamp,
	uuid,
	jsonb,
	index,
	uniqueIndex,
	text,
} from 'drizzle-orm/pg-core';

export const blocklists = pgTable(
	'blocklists',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		key: text('key').notNull(),
		blocklist: jsonb('blocklist').default([]),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('blocklists_key_idx').on(table.key),
		index('blocklists_created_at_idx').on(table.createdAt),
		index('blocklists_updated_at_idx').on(table.updatedAt),
	],
);

// No relations for blocklists table as it's standalone
