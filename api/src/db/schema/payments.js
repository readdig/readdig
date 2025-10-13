import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptions } from './subscriptions';

export const payments = pgTable(
	'payments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		subscriptionId: uuid('subscription_id')
			.references(() => subscriptions.id, { onDelete: 'cascade' })
			.notNull(),
		amount: text('amount').notNull(),
		country: text('country'),
		coupon: text('coupon'),
		payoutDate: timestamp('payout_date').notNull(),
		nextBillDate: timestamp('next_bill_date'),
		nextPaymentAmount: text('next_payment_amount'),
		// 'succeeded', 'failed', 'refunded'
		status: text('status').notNull(),
		orderId: text('order_id').notNull(),
		checkoutId: text('checkout_id').notNull(),
		paymentId: text('payment_id').notNull(),
		paymentMethod: text('payment_method'),
		paymentUserId: text('payment_user_id').notNull(),
		paymentSubscriptionId: text('payment_subscription_id').notNull(),
		refundDate: timestamp('refund_date').notNull(),
		// 'full', 'vat', 'partial'
		refundType: text('refund_type'),
		refundReason: text('refund_reason'),
		receiptUrl: text('receipt_url'),
		updateUrl: text('update_url'),
		cancelUrl: text('cancel_url'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		index('payments_user_idx').on(table.userId),
		index('payments_subscription_idx').on(table.subscriptionId),
		uniqueIndex('payments_order_id_idx').on(table.orderId),
		uniqueIndex('payments_payment_id_idx').on(table.paymentId),
		index('payments_status_idx').on(table.status),
		index('payments_created_at_idx').on(table.createdAt),
		index('payments_updated_at_idx').on(table.updatedAt),
	],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
	user: one(users, { fields: [payments.userId], references: [users.id] }),
	subscription: one(subscriptions, {
		fields: [payments.subscriptionId],
		references: [subscriptions.id],
	}),
}));
