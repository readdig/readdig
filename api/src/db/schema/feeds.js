import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	integer,
	uuid,
	jsonb,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { articles } from './articles';
import { follows } from './follows';
import { likes } from './likes';

export const feeds = pgTable(
	'feeds',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		duplicateOfId: uuid('duplicate_of_id').references(() => feeds.id, {
			onDelete: 'set null',
		}),
		title: text('title').notNull(),
		url: text('url').notNull(),
		feedUrl: text('feed_url').notNull(),
		feedUrls: jsonb('feed_urls').default([]),
		feedType: text('feed_type'), // 'xmlfeed', 'jsonfeed'
		canonicalUrl: text('canonical_url'),
		type: text('type'), // 'rss', 'podcast'
		description: text('description').default(''),
		images: jsonb('images').default({
			featured: '',
			banner: '',
			favicon: '',
			icon: '',
			og: '',
		}),
		featured: boolean('featured').default(false),
		fullText: boolean('full_text').default(false),
		datePublished: timestamp('date_published').defaultNow(),
		dateModified: timestamp('date_modified').defaultNow(),
		likes: integer('likes').default(0),
		valid: boolean('valid').default(true),
		language: text('language').default(''),
		fingerprint: text('fingerprint').notNull(),
		lastScraped: timestamp('last_scraped').defaultNow(),
		scrapeInterval: integer('scrape_interval').default(0),
		consecutiveScrapeFailures: integer('consecutive_scrape_failures').default(0),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('feeds_duplicate_of_idx').on(table.duplicateOfId),
		index('feeds_title_idx').on(table.title),
		index('feeds_url_idx').on(table.url),
		uniqueIndex('feeds_feed_url_idx').on(table.feedUrl),
		index('feeds_feed_urls_gin_idx').using('gin', table.feedUrls),
		index('feeds_feed_type_idx').on(table.feedType),
		index('feeds_type_idx').on(table.type),
		index('feeds_featured_idx').on(table.featured),
		index('feeds_valid_idx').on(table.valid),
		index('feeds_fingerprint_idx').on(table.fingerprint),
		index('feeds_last_scraped_idx').on(table.lastScraped),
		index('feeds_scrape_interval_idx').on(table.scrapeInterval),
		index('feeds_consecutive_scrape_failures_idx').on(table.consecutiveScrapeFailures),
		index('feeds_created_at_idx').on(table.createdAt),
		index('feeds_updated_at_idx').on(table.updatedAt),
	],
);

export const feedsRelations = relations(feeds, ({ one, many }) => ({
	duplicateOf: one(feeds, { fields: [feeds.duplicateOfId], references: [feeds.id] }),
	articles: many(articles),
	follows: many(follows),
	likes: many(likes),
}));
