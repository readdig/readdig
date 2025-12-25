import { relations } from 'drizzle-orm';
import {
	pgTable,
	timestamp,
	boolean,
	uuid,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';

export const reads = pgTable(
	'reads',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }),
		view: boolean('view').default(false),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('reads_user_idx').on(table.userId),
		index('reads_article_idx').on(table.articleId),
		uniqueIndex('reads_user_article_idx').on(table.userId, table.articleId),
		index('reads_user_view_idx').on(table.userId, table.view),
		index('reads_created_at_idx').on(table.createdAt),
		index('reads_updated_at_idx').on(table.updatedAt),
	],
);

export const readsRelations = relations(reads, ({ one }) => ({
	user: one(users, { fields: [reads.userId], references: [users.id] }),
	article: one(articles, { fields: [reads.articleId], references: [articles.id] }),
}));
