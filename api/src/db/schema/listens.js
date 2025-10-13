import { relations } from 'drizzle-orm';
import {
	pgTable,
	timestamp,
	boolean,
	integer,
	doublePrecision,
	uuid,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';

export const listens = pgTable(
	'listens',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		articleId: uuid('article_id')
			.references(() => articles.id, { onDelete: 'cascade' })
			.notNull(),
		open: boolean('open').default(false),
		playing: boolean('playing').default(false),
		played: doublePrecision('played').notNull().default(0),
		duration: doublePrecision('duration').notNull().default(0),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('listens_user_idx').on(table.userId),
		index('listens_article_idx').on(table.articleId),
		uniqueIndex('listens_user_article_idx').on(table.userId, table.articleId),
		index('listens_created_at_idx').on(table.createdAt),
		index('listens_updated_at_idx').on(table.updatedAt),
	],
);

export const listensRelations = relations(listens, ({ one }) => ({
	user: one(users, { fields: [listens.userId], references: [users.id] }),
	article: one(articles, { fields: [listens.articleId], references: [articles.id] }),
}));
