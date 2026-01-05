import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { articles } from './articles';

export const contents = pgTable(
	'contents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		url: text('url').notNull(),
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		title: text('title').notNull(),
		image: text('image'),
		excerpt: text('excerpt').notNull(),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('contents_url_idx').on(table.url),
		uniqueIndex('contents_article_idx').on(table.articleId),
		index('contents_created_at_idx').on(table.createdAt),
		index('contents_updated_at_idx').on(table.updatedAt),
	],
);

export const contentsRelations = relations(contents, ({ one }) => ({
	article: one(articles, { fields: [contents.articleId], references: [articles.id] }),
}));
