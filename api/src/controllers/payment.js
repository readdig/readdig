import { eq, desc, asc } from 'drizzle-orm';

import { db } from '../db';
import { payments, subscriptions, plans } from '../db/schema';

exports.list = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'createdAt,-1').split(',');
	const orderId = decodeURIComponent(query.orderId || '').trim();

	let orderBy = desc(payments.createdAt);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && payments[sortKey]) {
			orderBy = sortValue === 1 ? asc(payments[sortKey]) : desc(payments[sortKey]);
		}
	}

	let whereCondition;
	if (orderId) {
		whereCondition = eq(payments.orderId, orderId);
	}

	const data = await db
		.select()
		.from(payments)
		.where(whereCondition)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.history = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 10);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'createdAt,-1').split(',');

	let orderBy = desc(payments.createdAt);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && payments[sortKey]) {
			orderBy = sortValue === 1 ? asc(payments[sortKey]) : desc(payments[sortKey]);
		}
	}

	const data = await db.query.payments.findMany({
		where: eq(payments.userId, userId),
		with: {
			subscription: {
				with: {
					plan: true,
				},
			},
		},
		orderBy: orderBy,
		limit: limit,
		offset: offset,
	});

	res.json(data);
};
