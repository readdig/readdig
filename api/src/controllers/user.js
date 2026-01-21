import moment from 'moment';
import { eq, or, count, and, desc, asc, inArray, sql, like } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import {
	tags,
	stars,
	users,
	subscriptions,
	follows,
	reads,
	listens,
	folders,
	plans,
} from '../db/schema';
import gravatar from '../utils/gravatar';
import { isBlockedUsername } from '../utils/blocklist';
import { isDataURL, isEmail, isURL, isUsername } from '../utils/validation';
import { userSubscription } from '../utils/subscription';
import { hashPassword, serializeAuthenticatedUser, comparePassword } from '../utils/auth';

exports.list = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'createdAt,-1').split(',');
	const searchText = decodeURIComponent(query.q || '').trim();

	let orderBy = desc(users.createdAt);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && users[sortKey]) {
			orderBy = sortValue === 1 ? asc(users[sortKey]) : desc(users[sortKey]);
		}
	}

	let whereConditions = [];
	if (searchText) {
		const searchPattern = `%${searchText.toLowerCase()}%`;
		whereConditions.push(
			or(
				like(lower(users.name), searchPattern),
				like(lower(users.username), searchPattern),
				like(lower(users.email), searchPattern),
			),
		);
	}

	const usersData = await db
		.select({
			id: users.id,
			name: users.name,
			username: users.username,
			email: users.email,
			avatar: users.avatar,
			avatar: users.avatar,
			role: users.role,
			suspended: users.suspended,
			activeAt: users.activeAt,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
			settings: users.settings,
		})
		.from(users)
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset);

	const userIds = usersData.map((u) => u.id);
	if (userIds.length === 0) {
		return res.json([]);
	}

	const [
		followCounts,
		starCounts,
		readCounts,
		playCount,
		folderCounts,
		userSubscriptions,
	] = await Promise.all([
		db
			.select({
				userId: follows.userId,
				count: count(follows.id),
			})
			.from(follows)
			.where(inArray(follows.userId, userIds))
			.groupBy(follows.userId),

		db
			.select({
				userId: stars.userId,
				count: count(stars.id),
			})
			.from(stars)
			.where(inArray(stars.userId, userIds))
			.groupBy(stars.userId),

		db
			.select({
				userId: reads.userId,
				count: count(reads.id),
			})
			.from(reads)
			.where(inArray(reads.userId, userIds))
			.groupBy(reads.userId),

		db
			.select({
				userId: listens.userId,
				count: count(listens.id),
			})
			.from(listens)
			.where(inArray(listens.userId, userIds))
			.groupBy(listens.userId),

		db
			.select({
				userId: folders.userId,
				count: count(folders.id),
			})
			.from(folders)
			.where(inArray(folders.userId, userIds))
			.groupBy(folders.userId),

		db
			.select({
				userId: subscriptions.userId,
				plan: {
					id: plans.id,
					name: plans.name,
					basePrice: plans.basePrice,
				},
				status: subscriptions.status,
				nextBillDate: subscriptions.nextBillDate,
				expired: sql`CASE WHEN ${subscriptions.nextBillDate} <= NOW() THEN true ELSE false END`,
			})
			.from(subscriptions)
			.leftJoin(plans, eq(subscriptions.planId, plans.id))
			.where(
				and(
					inArray(subscriptions.userId, userIds),
					inArray(subscriptions.status, ['active', 'cancelled', 'deleted']),
				),
			)
			.orderBy(desc(subscriptions.nextBillDate), desc(subscriptions.updatedAt)),
	]);

	const followCountMap = new Map(followCounts.map((f) => [f.userId, f.count]));
	const starCountMap = new Map(starCounts.map((s) => [s.userId, s.count]));
	const readCountMap = new Map(readCounts.map((r) => [r.userId, r.count]));
	const playCountMap = new Map(playCount.map((p) => [p.userId, p.count]));
	const folderCountMap = new Map(folderCounts.map((f) => [f.userId, f.count]));
	const subscriptionMap = new Map(userSubscriptions.map((f) => [f.userId, f]));

	const gravatarCache = new Map();
	usersData.forEach((user) => {
		if (!user.avatar && user.email && !gravatarCache.has(user.email)) {
			gravatarCache.set(user.email, gravatar(user.email));
		}
	});

	const data = usersData.map((user) => ({
		id: user.id,
		name: user.name,
		username: user.username,
		email: user.email,
		avatar: user.avatar || (user.email ? gravatarCache.get(user.email) : null),
		avatar: user.avatar || (user.email ? gravatarCache.get(user.email) : null),
		role: user.role,
		admin: user.role === 'admin',
		free: user.role === 'free',
		suspended: user.suspended,
		activeAt: user.activeAt,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		settings: user.settings,
		subscription: subscriptionMap.get(user.id) || null,
		followCount: followCountMap.get(user.id) || 0,
		starCount: starCountMap.get(user.id) || 0,
		readCount: readCountMap.get(user.id) || 0,
		playCount: playCountMap.get(user.id) || 0,
		folderCount: folderCountMap.get(user.id) || 0,
	}));

	res.json(data);
};

exports.delete = async (req, res) => {
	const data = req.body || {};
	const userId = req.params.userId;

	if (userId !== req.user.sub) {
		return res.sendStatus(403);
	}

	const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	if (!(await comparePassword(data.password, user.password))) {
		return res.status(400).json('Password incorrect.');
	}

	const subscription = await userSubscription(userId);
	const isSubscriptionActived = subscription && !subscription.expired;
	const isFreePlan = subscription && subscription.basePrice === '0';

	if (isSubscriptionActived && !isFreePlan) {
		return res.status(400).json('This account subscription plan has not expired.');
	}

	await db.delete(users).where(eq(users.id, userId));

	res.sendStatus(204);
};

exports.get = async (req, res) => {
	const userId = req.params.userId;

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	let serialized = user;
	if (user.id === req.user.sub) {
		await db
			.update(users)
			.set({ activeAt: moment().toDate() })
			.where(eq(users.id, userId));

		serialized = await serializeAuthenticatedUser(user);
	}

	res.json(serialized);
};

exports.put = async (req, res) => {
	const userId = req.params.userId;

	if ((!req.User || !req.User.admin) && userId !== req.user.sub) {
		return res.sendStatus(403);
	}

	const data = req.body || {};

	if (data.name && !data.name.trim()) {
		return res.status(400).json('Invalid name field.');
	}

	if (data.email && !isEmail(data.email)) {
		return res.status(400).json('Invalid email address.');
	}

	if (data.username && isBlockedUsername(data.username)) {
		return res.status(400).json('Username is blocked.');
	}

	if (data.username && !isUsername(data.username)) {
		return res
			.status(400)
			.json('Username must be alphanumeric but can only contain _, . or -.');
	}

	if (data.avatar) {
		if (isURL(data.avatar)) {
			delete data.avatar;
		} else {
			if (!isDataURL(data.avatar)) {
				return res.status(400).json('Invalid avatar field.');
			}
		}
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	if (data.username) {
		data.username = data.username.trim().toLowerCase();
		const userByUsername = await db.query.users.findFirst({
			where: eq(lower(users.username), data.username),
		});

		if (userByUsername && userByUsername.id !== user.id) {
			return res.status(400).json('A user with this username already exists.');
		}
	}

	if (data.email) {
		data.email = data.email.trim().toLowerCase();
		const userByEmail = await db.query.users.findFirst({
			where: eq(lower(users.email), data.email),
		});

		if (userByEmail && userByEmail.id !== user.id) {
			return res.status(400).json('A user with this email already exists.');
		}
	}

	if (data.password && data.oldPassword) {
		if (!(await comparePassword(data.oldPassword, user.password))) {
			return res.status(400).json('The old password is incorrect.');
		}

		if (data.password && data.password.length < 6) {
			return res.status(400).json('Password incorrect.');
		}

		const cryptoPasswd = await hashPassword(data.password);
		data.password = cryptoPasswd;
	}

	if (data.role !== undefined) {
		if (!req.User || !req.User.admin) {
			return res.status(403).json('You must be an admin to perform this action.');
		}

		if (data.role === 'free') {
			if (user.role === 'admin') {
				return res.status(400).json('Cannot set admin user to free.');
			}
			const subscription = await userSubscription(userId);
			if (subscription && !subscription.expired) {
				return res.status(400).json('The user has an active subscription.');
			}
		}

		if (data.role === 'user') {
			const adminCount = await db.$count(users, eq(users.role, 'admin'));
			if (adminCount === 1 && user.role === 'admin') {
				return res.status(400).json('Must retain an admin user.');
			}
		}
	}

	if (data.settings !== undefined) {
		if (
			data.settings === null ||
			typeof data.settings !== 'object' ||
			Object.keys(data.settings || {}).length === 0
		) {
			return res.status(400).json('Invalid settings field.');
		}
	}

	const allowlist = Object.assign(
		{},
		...[
			'name',
			'email',
			'username',
			'avatar',
			'url',
			'bio',
			'password',
			'url',
			'bio',
			'password',
			'suspended',
			'role',
			'settings',
		].map(
			(key) =>
				data[key] !== undefined && {
					[key]: data[key],
				},
		),
	);

	const [updatedUser] = await db
		.update(users)
		.set(allowlist)
		.where(eq(users.id, userId))
		.returning();

	const serialized = await serializeAuthenticatedUser(updatedUser);
	res.json(serialized);
};

exports.history = async (req, res) => {
	const userId = req.params.userId;
	if (userId !== req.user.sub) {
		return res.sendStatus(403);
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const data = req.body || {};
	const services = data.services || [];

	if (services.length === 0) {
		return res.status(400).json('Services is required field.');
	}

	if (!(await comparePassword(data.password, user.password))) {
		return res.status(400).json('Password incorrect.');
	}

	await Promise.all(
		[
			services.includes('stars') && db.delete(tags).where(eq(tags.userId, userId)),
			services.includes('stars') && db.delete(stars).where(eq(stars.userId, userId)),
			services.includes('recent-read') &&
				db.delete(reads).where(eq(reads.userId, userId)),
			services.includes('recent-played') &&
				db.delete(listens).where(eq(listens.userId, userId)),
		].filter(Boolean),
	);

	res.sendStatus(204);
};
