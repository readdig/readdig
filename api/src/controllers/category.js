import { eq, like, desc, asc, and, sql, count, ne } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { categories, feedCategories, feeds } from '../db/schema';

exports.list = async (req, res) => {
	const query = req.query || {};
	const limit = parseInt(query.per_page || 100);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const name = decodeURIComponent(query.name || '').trim();

	let whereConditions = [];
	if (name) {
		whereConditions.push(like(lower(categories.name), `%${name.toLowerCase()}%`));
	}

	const data = await db
		.select({
			id: categories.id,
			name: categories.name,
			description: categories.description,
			icon: categories.icon,
			color: categories.color,
			sort: categories.sort,
			feedCount: sql`COALESCE(${count(feedCategories.id)}, 0)`.as('feedCount'),
			createdAt: categories.createdAt,
			updatedAt: categories.updatedAt,
		})
		.from(categories)
		.leftJoin(feedCategories, eq(feedCategories.categoryId, categories.id))
		.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
		.groupBy(categories.id)
		.orderBy(asc(categories.sort), asc(categories.name), asc(categories.id))
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.get = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;

	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		return res.status(404).json('Category does not exist.');
	}

	res.json(category);
};

exports.post = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const name = req.body.name;
	const description = req.body.description;
	const icon = req.body.icon;
	const color = req.body.color;
	const sort = req.body.sort;

	if (!name) {
		return res.status(400).json('Name is required field.');
	}

	if (name && name.length > 255) {
		return res.status(400).json('Name must not be greater than 255 characters.');
	}

	const existCategory = await db.query.categories.findFirst({
		where: eq(lower(categories.name), name.toLowerCase()),
	});

	if (existCategory) {
		return res.status(400).json('A category already exists with that name.');
	}

	const [category] = await db
		.insert(categories)
		.values({
			name: name,
			description: description || null,
			icon: icon || null,
			color: color || null,
			sort: sort || 0,
		})
		.returning();

	res.json(category);
};

exports.put = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;
	const name = req.body.name;
	const description = req.body.description;
	const icon = req.body.icon;
	const color = req.body.color;
	const sort = req.body.sort;

	if (!name) {
		return res.status(400).json('Name is required field.');
	}

	if (name && name.length > 255) {
		return res.status(400).json('Name must not be greater than 255 characters.');
	}

	const existCategory = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!existCategory) {
		return res.status(404).json('Category does not exist.');
	}

	const existName = await db.query.categories.findFirst({
		where: and(
			eq(lower(categories.name), name.toLowerCase()),
			ne(categories.id, categoryId),
		),
	});

	if (existName) {
		return res.status(400).json('A category already exists with that name.');
	}

	const [category] = await db
		.update(categories)
		.set({
			name: name,
			description: description !== undefined ? description : existCategory.description,
			icon: icon !== undefined ? icon : existCategory.icon,
			color: color !== undefined ? color : existCategory.color,
			sort: sort !== undefined ? sort : existCategory.sort,
			updatedAt: new Date(),
		})
		.where(eq(categories.id, categoryId))
		.returning();

	res.json(category);
};

exports.delete = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;

	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		return res.status(404).json('Category does not exist.');
	}

	await db.delete(categories).where(eq(categories.id, categoryId));

	res.sendStatus(204);
};

// Get feeds in a category
exports.getFeeds = async (req, res) => {
	const categoryId = req.params.id;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 50);
	const offset = (parseInt(query.page || 1) - 1) * limit;

	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		return res.status(404).json('Category does not exist.');
	}

	const data = await db
		.select({
			id: feeds.id,
			title: feeds.title,
			url: feeds.url,
			feedUrl: feeds.feedUrl,
			description: feeds.description,
			type: feeds.type,
			createdAt: feedCategories.createdAt,
		})
		.from(feedCategories)
		.innerJoin(feeds, eq(feeds.id, feedCategories.feedId))
		.where(eq(feedCategories.categoryId, categoryId))
		.orderBy(desc(feedCategories.createdAt), asc(feeds.title))
		.limit(limit)
		.offset(offset);

	res.json(data);
};

// Add feed to category
exports.addFeed = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;
	const feedId = req.params.feedId;

	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		return res.status(404).json('Category does not exist.');
	}

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		return res.status(404).json('Feed does not exist.');
	}

	const existRelation = await db.query.feedCategories.findFirst({
		where: and(
			eq(feedCategories.categoryId, categoryId),
			eq(feedCategories.feedId, feedId),
		),
	});

	if (existRelation) {
		return res.status(400).json('Feed already in this category.');
	}

	const [relation] = await db
		.insert(feedCategories)
		.values({
			categoryId: categoryId,
			feedId: feedId,
		})
		.returning();

	res.json(relation);
};

// Remove feed from category
exports.removeFeed = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;
	const feedId = req.params.feedId;

	await db
		.delete(feedCategories)
		.where(
			and(eq(feedCategories.categoryId, categoryId), eq(feedCategories.feedId, feedId)),
		);

	res.sendStatus(204);
};

// Batch update feeds in category
exports.updateFeeds = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const categoryId = req.params.id;
	const feedIds = req.body.feedIds || [];

	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
	});

	if (!category) {
		return res.status(404).json('Category does not exist.');
	}

	// Remove all existing relations
	await db.delete(feedCategories).where(eq(feedCategories.categoryId, categoryId));

	// Add new relations
	if (feedIds.length > 0) {
		await db.insert(feedCategories).values(
			feedIds.map((feedId) => ({
				categoryId: categoryId,
				feedId: feedId,
			})),
		);
	}

	res.sendStatus(204);
};
