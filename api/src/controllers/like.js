import { eq, and } from 'drizzle-orm';

import { db } from '../db';
import { likes, articles, feeds } from '../db/schema';
import { isUUID } from '../utils/validation';

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const { type, id } = req.params;

	if (!['article', 'feed'].includes(type)) {
		return res.status(400).json('Invalid type. Must be "article" or "feed".');
	}

	if (!isUUID(id)) {
		return res.status(400).json(`Invalid UUID: ${id}`);
	}

	let entity;
	let table;
	let idField;

	if (type === 'article') {
		entity = await db.query.articles.findFirst({ where: eq(articles.id, id) });
		table = articles;
		idField = likes.articleId;
	} else {
		entity = await db.query.feeds.findFirst({ where: eq(feeds.id, id) });
		table = feeds;
		idField = likes.feedId;
	}

	if (!entity) {
		return res.status(404).json(`${type} does not exist.`);
	}

	const exists = await db.query.likes.findFirst({
		where: and(eq(likes.userId, userId), eq(idField, id)),
	});

	if (exists) {
		return res.status(400).json('Already liked.');
	}

	await db.insert(likes).values({
		userId,
		[type === 'article' ? 'articleId' : 'feedId']: id,
	});

	await db
		.update(table)
		.set({ likes: entity.likes + 1 })
		.where(eq(table.id, id));

	res.sendStatus(204);
};

exports.delete = async (req, res) => {
	const userId = req.user.sub;
	const { type, id } = req.params;

	if (!['article', 'feed'].includes(type)) {
		return res.status(400).json('Invalid type. Must be "article" or "feed".');
	}

	if (!isUUID(id)) {
		return res.status(400).json(`Invalid UUID: ${id}`);
	}

	let entity;
	let table;
	let idField;

	if (type === 'article') {
		entity = await db.query.articles.findFirst({ where: eq(articles.id, id) });
		table = articles;
		idField = likes.articleId;
	} else {
		entity = await db.query.feeds.findFirst({ where: eq(feeds.id, id) });
		table = feeds;
		idField = likes.feedId;
	}

	if (!entity) {
		return res.status(404).json(`${type} does not exist.`);
	}

	const exists = await db.query.likes.findFirst({
		where: and(eq(likes.userId, userId), eq(idField, id)),
	});

	if (!exists) {
		return res.status(404).json('Like does not exist.');
	}

	await db.delete(likes).where(and(eq(likes.userId, userId), eq(idField, id)));

	await db
		.update(table)
		.set({ likes: Math.max(0, entity.likes - 1) })
		.where(eq(table.id, id));

	res.sendStatus(204);
};
