import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	jsonb,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { articles } from './articles';

export const replies = pgTable(
	'replies',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		source: text('source').notNull().default('v2ex'),
		// Provider-side reply id, used for upserting (e.g. v2ex reply id)
		sourceId: text('source_id').notNull(),
		floor: integer('floor').default(0),
		content: text('content').default(''),
		contentRendered: text('content_rendered').default(''),
		author: jsonb('author').default({
			name: '',
			url: '',
			avatar: '',
		}),
		thanks: integer('thanks').default(0),
		datePublished: timestamp('date_published').defaultNow(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		// (article_id, source_id): unique, also the upsert conflict target.
		uniqueIndex('replies_article_source_idx').on(table.articleId, table.sourceId),
		// (article_id, floor): serves the ordered read `WHERE article_id ORDER BY floor`.
		// A standalone (article_id) index is redundant — both composites lead with it.
		index('replies_article_floor_idx').on(table.articleId, table.floor),
	],
);

export const repliesRelations = relations(replies, ({ one }) => ({
	article: one(articles, { fields: [replies.articleId], references: [articles.id] }),
}));
