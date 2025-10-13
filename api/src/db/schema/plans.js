import { relations } from 'drizzle-orm';
import {
	pgTable,
	timestamp,
	integer,
	uuid,
	decimal,
	index,
	text,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { subscriptions } from './subscriptions';

export const plans = pgTable(
	'plans',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		slogan: text('slogan').default(''),
		productId: text('product_id').default(''),
		billingPeriod: integer('billing_period').notNull().default(1),
		// 'day', 'month', 'year'
		billingType: text('billing_type').notNull().default('month'),
		basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull().default('0'),
		features: text('features').default(''),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow(),
	},
	(table) => [
		uniqueIndex('plans_name_idx').on(table.name),
		index('plans_created_at_idx').on(table.createdAt),
		index('plans_updated_at_idx').on(table.updatedAt),
	],
);

export const plansRelations = relations(plans, ({ many }) => ({
	subscriptions: many(subscriptions),
}));
