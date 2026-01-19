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
import { feeds } from './feeds';
import { contents } from './contents';
import { reads } from './reads';
import { stars } from './stars';
import { listens } from './listens';
import { likes } from './likes';

export const articles = pgTable(
	'articles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		feedId: uuid('feed_id')
			.references(() => feeds.id, { onDelete: 'cascade' })
			.notNull(),
		duplicateOfId: uuid('duplicate_of_id').references(() => articles.id, {
			onDelete: 'set null',
		}),
		url: text('url').default(''),
		canonicalUrl: text('canonical_url'),
		guid: text('guid').notNull(),
		title: text('title').notNull().default(''),
		description: text('description').default(''),
		content: text('content').default(''),
		attachments: jsonb('attachments').default([]),
		type: text('type').notNull(), // 'article', 'episode'
		images: jsonb('images').default({
			featured: '',
			banner: '',
			icon: '',
			og: '',
		}),
		author: jsonb('author').default({
			name: '',
			url: '',
			avatar: '',
		}),
		likes: integer('likes').default(0),
		views: integer('views').default(0),
		fingerprint: text('fingerprint').notNull(),
		datePublished: timestamp('date_published').defaultNow(),
		dateModified: timestamp('date_modified').defaultNow(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('articles_feed_idx').on(table.feedId),
		index('articles_duplicate_of_idx').on(table.duplicateOfId),
		index('articles_url_idx').on(table.url),
		index('articles_guid_idx').on(table.guid),
		index('articles_title_idx').on(table.title),
		index('articles_type_idx').on(table.type),
		index('articles_fingerprint_idx').on(table.fingerprint),
		index('articles_feed_id_idx').on(table.feedId, table.id),
		uniqueIndex('articles_feed_guid_idx').on(table.feedId, table.guid),
		uniqueIndex('articles_feed_fingerprint_idx').on(table.feedId, table.fingerprint),
		index('articles_feed_created_at_idx').on(table.feedId, table.createdAt),
		index('articles_created_at_idx').on(table.createdAt),
		index('articles_updated_at_idx').on(table.updatedAt),
		index('articles_views_idx').on(table.views),
	],
);

export const articlesRelations = relations(articles, ({ one, many }) => ({
	feed: one(feeds, { fields: [articles.feedId], references: [feeds.id] }),
	duplicateOf: one(articles, {
		fields: [articles.duplicateOfId],
		references: [articles.id],
	}),
	content: one(contents, { fields: [articles.id], references: [contents.articleId] }),
	reads: many(reads),
	stars: many(stars),
	listens: many(listens),
	likes: many(likes),
}));
