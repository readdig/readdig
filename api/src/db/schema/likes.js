import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';
import { feeds } from './feeds';

export const likes = pgTable(
	'likes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }),
		feedId: uuid('feed_id').references(() => feeds.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => [
		index('likes_user_idx').on(table.userId),
		index('likes_article_idx').on(table.articleId),
		index('likes_feed_idx').on(table.feedId),
		uniqueIndex('likes_user_article_idx').on(table.userId, table.articleId),
		uniqueIndex('likes_user_feed_idx').on(table.userId, table.feedId),
		index('likes_created_at_idx').on(table.createdAt),
	],
);

export const likesRelations = relations(likes, ({ one }) => ({
	user: one(users, { fields: [likes.userId], references: [users.id] }),
	article: one(articles, { fields: [likes.articleId], references: [articles.id] }),
	feed: one(feeds, { fields: [likes.feedId], references: [feeds.id] }),
}));
