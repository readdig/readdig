import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { feeds } from './feeds';
import { categories } from './categories';

export const feedCategories = pgTable(
	'feed_categories',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedId: uuid('feed_id')
			.references(() => feeds.id, { onDelete: 'cascade' })
			.notNull(),
		categoryId: uuid('category_id')
			.references(() => categories.id, { onDelete: 'cascade' })
			.notNull(),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('feed_categories_feed_category_idx').on(table.feedId, table.categoryId),
		index('feed_categories_feed_idx').on(table.feedId),
		index('feed_categories_category_idx').on(table.categoryId),
	],
);

export const feedCategoriesRelations = relations(feedCategories, ({ one }) => ({
	feed: one(feeds, { fields: [feedCategories.feedId], references: [feeds.id] }),
	category: one(categories, {
		fields: [feedCategories.categoryId],
		references: [categories.id],
	}),
}));
