import { eq, desc, sql, inArray, and } from 'drizzle-orm';

import { db } from '../db';
import { subscriptions } from '../db/schema';

export const userSubscription = async (userId) => {
	const [subscription] = await db
		.select({
			id: subscriptions.id,
			planId: subscriptions.planId,
			status: subscriptions.status,
			nextBillDate: subscriptions.nextBillDate,
			payoutDate: subscriptions.payoutDate,
			updatedAt: subscriptions.updatedAt,
			expired: sql`CASE WHEN ${subscriptions.nextBillDate} <= NOW() THEN true ELSE false END`,
		})
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.userId, userId),
				inArray(subscriptions.status, ['active', 'cancelled', 'deleted']),
			),
		)
		.orderBy(desc(subscriptions.nextBillDate), desc(subscriptions.updatedAt))
		.limit(1);

	return subscription;
};
