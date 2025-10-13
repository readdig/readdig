import { eq, ne, and, like, desc, asc, sql } from 'drizzle-orm';

import { db } from '../db';
import { plans, subscriptions } from '../db/schema';

exports.list = async (req, res) => {
	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'basePrice,1').split(',');
	const name = decodeURIComponent(query.name || '').trim();

	let orderBy = desc(plans.basePrice);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && plans[sortKey]) {
			orderBy = sortValue === 1 ? asc(plans[sortKey]) : desc(plans[sortKey]);
		}
	}

	let whereConditions = [];
	if (name) {
		const searchTerms = name
			.trim()
			.split(' ')
			.filter((s) => s);
		for (const term of searchTerms) {
			whereConditions.push(like(plans.name, `%${term}%`));
		}
	}

	const data = await db
		.select({
			id: plans.id,
			name: plans.name,
			slogan: plans.slogan,
			productId: plans.productId,
			billingPeriod: plans.billingPeriod,
			billingType: plans.billingType,
			basePrice: plans.basePrice,
			features: plans.features,
			isSubscription: sql`CASE WHEN COUNT(${subscriptions.id}) > 0 THEN true ELSE false END`,
		})
		.from(plans)
		.leftJoin(subscriptions, eq(plans.id, subscriptions.planId))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(plans.id)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.get = async (req, res) => {
	const planId = req.params.planId;

	const plan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
	if (!plan) {
		return res.status(404).json('Plan does not exist.');
	}

	res.json(plan);
};

exports.post = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const body = req.body || {};
	const data = {
		name: body.name,
		slogan: body.slogan,
		productId: body.productId,
		billingPeriod: body.billingPeriod || 1,
		billingType: body.billingType,
		basePrice: body.basePrice,
		features: body.features,
	};

	if (!data.name) {
		return res.status(400).json('Name is required field');
	}

	const exists = await db.query.plans.findFirst({ where: eq(plans.name, data.name) });
	if (exists) {
		return res.status(400).json('A plan already exists with that name.');
	}

	const [plan] = await db.insert(plans).values(data).returning();

	res.json(plan);
};

exports.put = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const planId = req.params.planId;
	const body = req.body || {};
	const data = {
		name: body.name,
		slogan: body.slogan,
		features: body.features,
	};

	const isSubscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.planId, planId),
	});

	if (!isSubscription) {
		data['productId'] = body.productId;
		data['billingPeriod'] = body.billingPeriod || 1;
		data['billingType'] = body.billingType;
		data['basePrice'] = body.basePrice;
	}

	if (!data.name) {
		return res.status(400).json('Name is required field.');
	}

	const plan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
	if (!plan) {
		return res.status(404).json('Plan does not exist.');
	}

	const exists = await db.query.plans.findFirst({
		where: and(ne(plans.id, planId), eq(plans.name, data.name)),
	});
	if (exists) {
		return res.status(400).json('A plan already exists with that name.');
	}

	const [updated] = await db
		.update(plans)
		.set(data)
		.where(eq(plans.id, planId))
		.returning();

	res.json(updated);
};

exports.delete = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const planId = req.params.planId;

	const plan = await db.query.plans.findFirst({ where: eq(plans.id, planId) });
	if (!plan) {
		return res.status(404).json(`Plan does not exist.`);
	}

	const isSubscription = await db.query.subscriptions.findFirst({
		where: eq(subscriptions.planId, planId),
	});

	if (isSubscription) {
		return res.status(400).json(`Plan is used, cannot be deleted.`);
	}

	await db.delete(plans).where(eq(plans.id, planId));

	res.sendStatus(204);
};
