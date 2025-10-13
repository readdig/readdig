import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { follows } from './follows';

export const folders = pgTable(
	'folders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(),
		icon: text('icon'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('folders_user_name_idx').on(table.userId, table.name),
		index('folders_user_idx').on(table.userId),
		index('folders_created_at_idx').on(table.createdAt),
		index('folders_updated_at_idx').on(table.updatedAt),
	],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
	user: one(users, { fields: [folders.userId], references: [users.id] }),
	follows: many(follows),
}));
