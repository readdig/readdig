import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	uuid,
	index,
	uniqueIndex,
	integer,
} from 'drizzle-orm/pg-core';
import { feedCategories } from './feed-categories';

export const categories = pgTable(
	'categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		description: text('description'),
		icon: text('icon').notNull(),
		color: text('color').notNull(),
		sort: integer('sort').default(0),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('categories_name_idx').on(table.name),
		index('categories_sort_idx').on(table.sort),
		index('categories_created_at_idx').on(table.createdAt),
	],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
	feedCategories: many(feedCategories),
}));
