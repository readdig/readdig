import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	uuid,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { feeds } from './feeds';
import { folders } from './folders';

export const follows = pgTable(
	'follows',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		feedId: uuid('feed_id')
			.references(() => feeds.id, { onDelete: 'cascade' })
			.notNull(),
		folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
		alias: text('alias'),
		primary: boolean('primary').default(true),
		fullText: boolean('full_text').default(false),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('follows_user_idx').on(table.userId),
		index('follows_feed_idx').on(table.feedId),
		index('follows_folder_idx').on(table.folderId),
		index('follows_alias_idx').on(table.alias),
		index('follows_primary_idx').on(table.primary),
		uniqueIndex('follows_user_feed_folder_idx').on(
			table.userId,
			table.feedId,
			table.folderId,
		),
		uniqueIndex('follows_user_feed_alias_idx').on(
			table.userId,
			table.feedId,
			table.alias,
		),
		index('follows_created_at_idx').on(table.createdAt),
		index('follows_updated_at_idx').on(table.updatedAt),
	],
);

export const followsRelations = relations(follows, ({ one }) => ({
	user: one(users, { fields: [follows.userId], references: [users.id] }),
	feed: one(feeds, { fields: [follows.feedId], references: [feeds.id] }),
	folder: one(folders, { fields: [follows.folderId], references: [folders.id] }),
}));
