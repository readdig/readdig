import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';

export const stars = pgTable(
	'stars',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		tagIds: jsonb('tag_ids').default([]),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('stars_user_idx').on(table.userId),
		index('stars_article_idx').on(table.articleId),
		uniqueIndex('stars_user_article_idx').on(table.userId, table.articleId),
		index('stars_tag_ids_gin_idx').using('gin', table.tagIds),
		index('stars_created_at_idx').on(table.createdAt),
		index('stars_updated_at_idx').on(table.updatedAt),
	],
);

export const starsRelations = relations(stars, ({ one }) => ({
	user: one(users, { fields: [stars.userId], references: [users.id] }),
	article: one(articles, { fields: [stars.articleId], references: [articles.id] }),
}));
