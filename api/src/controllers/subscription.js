import moment from 'moment';
import { eq, and } from 'drizzle-orm';

import { db } from '../db';
import { plans, subscriptions, payments } from '../db/schema';
import { logger } from '../utils/logger';
import { userSubscription } from '../utils/subscription';
import {
	getSubscriptionPlans,
	cancelSubscription,
	getTransactions,
} from '../utils/paddle';

exports.plans = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	try {
		const data = await getSubscriptionPlans();
		if (data.success) {
			return res.json(data.response);
		} else {
			logger.error(data.error);
			return res.status(400).json(data.error.message);
		}
	} catch (err) {
		logger.error(err);
		return res.status(404).json('Get paddle subscription plans error.');
	}
};

exports.cancel = async (req, res) => {
	const userId = req.user.sub;
	const subscriptionId = req.body.subscriptionId;

	const subscription = await db.query.subscriptions.findFirst({
		where: and(
			eq(subscriptions.userId, userId),
			eq(subscriptions.id, subscriptionId),
			eq(subscriptions.status, 'active'),
		),
	});

	if (!subscription) {
		return res.status(404).json('Subscription plan does not exist.');
	}

	try {
		const data = await cancelSubscription(subscription.paymentSubscriptionId);
		if (data.success) {
			await db
				.update(subscriptions)
				.set({ status: 'cancelled' })
				.where(
					and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
				);
			return res.sendStatus(204);
		} else {
			logger.error(data.error);
			return res.status(400).json(data.error.message);
		}
	} catch (err) {
		logger.error(err);
		return res.status(404).json('Paddle cancel subscription plan error.');
	}
};

exports.transaction = async (req, res) => {
	const userId = req.user.sub;
	const checkoutId = req.body.checkoutId;

	const payment = await db.query.payments.findFirst({
		where: and(eq(payments.userId, userId), eq(payments.checkoutId, checkoutId)),
	});

	if (payment) {
		return res.sendStatus(204);
	}

	try {
		const data = await getTransactions(checkoutId);
		if (data.success) {
			if (data.response && data.response.length) {
				const response = data.response[0];
				const passthrough = JSON.parse(response.passthrough);
				const userId = passthrough.userId;
				const subscriptionId = parseInt(passthrough.subscriptionId);

				if (userId !== userId) {
					return res.status(404).json('Subscription does not exist.');
				}

				const subscription = await db.query.subscriptions.findFirst({
					where: eq(subscriptions.id, subscriptionId),
					columns: {
						id: true,
						planId: true,
					},
					with: {
						plan: {
							columns: {
								billingPeriod: true,
								billingType: true,
							},
						},
					},
				});

				if (!subscription) {
					return res.status(404).json('Subscription does not exist.');
				}

				if (
					response.status === 'completed' &&
					response.is_subscription &&
					response.subscription.status === 'active'
				) {
					const billingPeriod = parseInt(subscription.plan.billingPeriod);
					const billingType = `${subscription.plan.billingType}s`;
					await db
						.update(subscriptions)
						.set({
							status: 'active',
							paymentSubscriptionId: response.subscription.subscription_id,
							payoutDate: moment().toDate(),
							nextBillDate: moment().add(billingPeriod, billingType).toDate(),
						})
						.where(
							and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
						);
					return res.sendStatus(204);
				}
			}
			return res.status(404).json('Subscription transaction not found.');
		} else {
			logger.error(data.error);
			return res.status(400).json(data.error.message);
		}
	} catch (err) {
		logger.error(err);
		return res.status(404).json('Paddle subscription transactions error.');
	}
};

exports.get = async (req, res) => {
	const userId = req.user.sub;
	const subscriptionId = req.params.subscriptionId;

	if (req.User.admin) {
		return res.status(400).json('Your account does not need subscription plan.');
	}

	const exists = await db.query.subscriptions.findFirst({
		where: and(eq(subscriptions.userId, userId), eq(subscriptions.id, subscriptionId)),
		with: {
			plan: true,
		},
		columns: {
			id: true,
		},
	});

	if (!exists) {
		return res.status(404).json('Subscription does not exist.');
	}

	const subscription = await userSubscription(userId);
	if (subscription && !subscription.expired) {
		return res.status(400).json('You already have active subscription plan.');
	}

	res.json(exists);
};

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const planId = req.params.planId;

	if (req.User.admin) {
		return res.status(400).json('Your account does not need subscription plan.');
	}

	const plan = await db.query.plans.findFirst({
		where: eq(plans.id, planId),
	});

	if (!plan) {
		return res.status(404).json('Plan does not exist.');
	}

	let subscription = await db.query.subscriptions.findFirst({
		where: and(eq(subscriptions.userId, userId), eq(subscriptions.planId, planId)),
	});

	if (parseFloat(plan.basePrice) === 0) {
		if (!subscription) {
			const billingPeriod = parseInt(plan.billingPeriod);
			const billingType = `${plan.billingType}s`;

			const [newSubscription] = await db
				.insert(subscriptions)
				.values({
					userId: userId,
					planId: planId,
					status: 'active',
					payoutDate: moment().toDate(),
					nextBillDate: moment().add(billingPeriod, billingType).toDate(),
				})
				.onConflictDoUpdate({
					target: [subscriptions.userId, subscriptions.planId],
					set: {
						status: 'active',
						payoutDate: moment().toDate(),
						nextBillDate: moment().add(billingPeriod, billingType).toDate(),
					},
				})
				.returning();

			subscription = newSubscription;
		}
	} else {
		if (!subscription) {
			const [newSubscription] = await db
				.insert(subscriptions)
				.values({
					userId: userId,
					planId: planId,
					status: 'inactive',
				})
				.returning();

			subscription = newSubscription;
		}
	}

	return res.json(subscription);
};
