import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, index, uniqueIndex, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tags = pgTable(
	'tags',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('tags_user_name_idx').on(table.userId, table.name),
		index('tags_user_idx').on(table.userId),
		index('tags_created_at_idx').on(table.createdAt),
		index('tags_updated_at_idx').on(table.updatedAt),
	],
);

export const tagsRelations = relations(tags, ({ one }) => ({
	user: one(users, { fields: [tags.userId], references: [users.id] }),
}));
