import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, index, uniqueIndex, text } from 'drizzle-orm/pg-core';
import { users } from './users';
import { plans } from './plans';
import { payments } from './payments';

export const subscriptions = pgTable(
	'subscriptions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		planId: uuid('plan_id')
			.references(() => plans.id, { onDelete: 'cascade' })
			.notNull(),
		// 'inactive', 'active', 'cancelled', 'deleted'
		status: text('status').notNull().default('inactive'),
		paymentSubscriptionId: text('payment_subscription_id'),
		payoutDate: timestamp('payout_date'),
		nextBillDate: timestamp('next_bill_date'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('subscriptions_user_plan_idx').on(table.userId, table.planId),
		index('subscriptions_user_idx').on(table.userId),
		index('subscriptions_plan_idx').on(table.planId),
		index('subscriptions_status_idx').on(table.status),
		index('subscriptions_created_at_idx').on(table.createdAt),
		index('subscriptions_updated_at_idx').on(table.updatedAt),
	],
);

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
	user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
	plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
	payments: many(payments),
}));
