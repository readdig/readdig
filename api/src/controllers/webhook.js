import moment from 'moment';
import { eq, and } from 'drizzle-orm';
import { validatePaddleWebhook } from 'paddle-webhook-utils';

import { config } from '../config';
import { db } from '../db';
import { users, subscriptions, payments } from '../db/schema';

exports.post = async (req, res) => {
	if (
		!req.body ||
		!req.body.p_signature ||
		!validatePaddleWebhook({
			webhookData: req.body,
			publicKey: config.paddle.publicKey,
		})
	) {
		return res.sendStatus(403);
	}

	const passthrough = JSON.parse(req.body.passthrough);
	const userId = passthrough.userId;
	const subscriptionId = passthrough.subscriptionId;

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const subscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.id, subscriptionId),
	});

	if (!subscription) {
		return res.status(404).json('Subscription does not exist.');
	}

	switch (req.body.alert_name) {
		case 'subscription_cancelled':
			await db
				.update(subscriptions)
				.set({
					status: 'cancelled',
					nextBillDate: moment.utc(req.body.cancellation_effective_date).toDate(),
					updatedAt: new Date(),
				})
				.where(
					and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
				);
			break;
		case 'subscription_payment_succeeded':
			await db
				.update(subscriptions)
				.set({
					status: 'active',
					paymentSubscriptionId: req.body.subscription_id,
					payoutDate: moment.utc(req.body.event_time).toDate(),
					nextBillDate: moment.utc(req.body.next_bill_date).toDate(),
					updatedAt: new Date(),
				})
				.where(
					and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
				);

			await db
				.insert(payments)
				.values({
					userId: userId,
					subscriptionId: subscriptionId,
					status: 'succeeded',
					amount: req.body.balance_gross,
					country: req.body.country,
					coupon: req.body.coupon,
					orderId: req.body.order_id,
					checkoutId: req.body.checkout_id,
					paymentId: req.body.subscription_payment_id,
					paymentUserId: req.body.user_id,
					paymentSubscriptionId: req.body.subscription_id,
					payoutDate: moment.utc(req.body.event_time).toDate(),
					nextBillDate: moment.utc(req.body.next_bill_date).toDate(),
					nextPaymentAmount: req.body.next_payment_amount,
					paymentMethod: req.body.payment_method,
					receiptUrl: req.body.receipt_url,
				})
				.onConflictDoUpdate({
					target: [payments.userId, payments.subscriptionId, payments.paymentId],
					set: {
						status: 'succeeded',
						amount: req.body.balance_gross,
						country: req.body.country,
						coupon: req.body.coupon,
						orderId: req.body.order_id,
						checkoutId: req.body.checkout_id,
						paymentUserId: req.body.user_id,
						payoutDate: moment.utc(req.body.event_time).toDate(),
						nextBillDate: moment.utc(req.body.next_bill_date).toDate(),
						nextPaymentAmount: req.body.next_payment_amount,
						paymentMethod: req.body.payment_method,
						receiptUrl: req.body.receipt_url,
						updatedAt: new Date(),
					},
				});
			break;
		case 'subscription_payment_failed':
			await db
				.update(subscriptions)
				.set({
					status: 'cancelled',
					updatedAt: new Date(),
				})
				.where(
					and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
				);

			await db
				.insert(payments)
				.values({
					userId: userId,
					subscriptionId: subscriptionId,
					status: 'failed',
					amount: req.body.amount,
					orderId: req.body.order_id,
					checkoutId: req.body.checkout_id,
					paymentId: req.body.subscription_payment_id,
					paymentUserId: req.body.user_id,
					paymentSubscriptionId: req.body.subscription_id,
					payoutDate: moment.utc(req.body.event_time).toDate(),
					updateUrl: req.body.update_url,
					cancelUrl: req.body.cancel_url,
				})
				.onConflictDoUpdate({
					target: [payments.userId, payments.subscriptionId, payments.paymentId],
					set: {
						status: 'failed',
						amount: req.body.amount,
						orderId: req.body.order_id,
						checkoutId: req.body.checkout_id,
						paymentUserId: req.body.user_id,
						payoutDate: moment.utc(req.body.event_time).toDate(),
						updateUrl: req.body.update_url,
						cancelUrl: req.body.cancel_url,
						updatedAt: new Date(),
					},
				});
			break;
		case 'subscription_payment_refunded':
			await db
				.update(subscriptions)
				.set({
					status: 'deleted',
					nextBillDate: moment().subtract(1, 'days').toDate(),
					updatedAt: new Date(),
				})
				.where(
					and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
				);

			await db
				.insert(payments)
				.values({
					userId: userId,
					subscriptionId: subscriptionId,
					status: 'refunded',
					amount: req.body.amount,
					orderId: req.body.order_id,
					checkoutId: req.body.checkout_id,
					paymentId: req.body.subscription_payment_id,
					paymentUserId: req.body.user_id,
					paymentSubscriptionId: req.body.subscription_id,
					refundDate: moment.utc(req.body.event_time).toDate(),
					refundType: req.body.refund_type,
					refundReason: req.body.refund_reason,
				})
				.onConflictDoUpdate({
					target: [payments.userId, payments.subscriptionId, payments.paymentId],
					set: {
						status: 'refunded',
						amount: req.body.amount,
						orderId: req.body.order_id,
						checkoutId: req.body.checkout_id,
						paymentUserId: req.body.user_id,
						refundDate: moment.utc(req.body.event_time).toDate(),
						refundType: req.body.refund_type,
						refundReason: req.body.refund_reason,
						updatedAt: new Date(),
					},
				});
			break;
	}

	res.sendStatus(200);
};
