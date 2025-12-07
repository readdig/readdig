import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	uuid,
	jsonb,
	index,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { lower } from '../lower';
import { subscriptions } from './subscriptions';
import { follows } from './follows';
import { folders } from './folders';
import { tags } from './tags';
import { reads } from './reads';
import { stars } from './stars';
import { listens } from './listens';
import { payments } from './payments';
import { likes } from './likes';

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: text('email').notNull(),
		username: text('username').notNull(),
		password: text('password').notNull(),
		name: text('name').notNull(),
		avatar: text('avatar').default(''),
		bio: text('bio').default(''),
		url: text('url').default(''),
		background: text('background').default(''),
		recoveryCode: text('recovery_code').default(''),
		role: text('role').default('user').notNull(), // user, admin, free
		suspended: boolean('suspended').default(false),
		activeAt: timestamp('active_at').defaultNow(),
		settings: jsonb('settings').default({
			unreadOnly: false,
			mobileHideSidebar: true,
			fontSize: 0,
			textSize: 0,
			language: '',
		}),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('users_email_idx').on(lower(table.email)),
		uniqueIndex('users_username_idx').on(table.username),
		index('users_role_idx').on(table.role),
		index('users_suspended_idx').on(table.suspended),
		index('users_active_at_idx').on(table.activeAt),
		index('users_created_at_idx').on(table.createdAt),
		index('users_updated_at_idx').on(table.updatedAt),
	],
);

export const usersRelations = relations(users, ({ many }) => ({
	subscriptions: many(subscriptions),
	follows: many(follows),
	folders: many(folders),
	tags: many(tags),
	reads: many(reads),
	stars: many(stars),
	listens: many(listens),
	payments: many(payments),
	likes: many(likes),
}));
