import { eq, like, desc, asc, and, sql, count, ne } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { tags, stars } from '../db/schema';

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const articleId = query.articleId;
	const name = decodeURIComponent(query.name || '').trim();

	let whereConditions = [eq(tags.userId, userId)];
	if (name) {
		whereConditions.push(like(lower(tags.name), `%${name.toLowerCase()}%`));
	}

	const data = await db
		.select({
			id: tags.id,
			userId: tags.userId,
			name: tags.name,
			createdAt: tags.createdAt,
			updatedAt: tags.updatedAt,
			starCount: sql`COALESCE(${count(stars.id)}, 0)`.as('starCount'),
		})
		.from(tags)
		.leftJoin(
			stars,
			and(
				sql`${stars.tagIds} @> jsonb_build_array(${tags.id})`,
				eq(stars.userId, userId),
				...(articleId ? [eq(stars.articleId, articleId)] : []),
			),
		)
		.where(and(...whereConditions))
		.groupBy(tags.id, tags.userId, tags.name, tags.createdAt, tags.updatedAt)
		.orderBy(
			...(articleId
				? [desc(sql`COALESCE(${count(stars.id)}, 0)`), asc(tags.id)]
				: [desc(tags.createdAt), asc(tags.id)]),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const name = req.body.name;

	if (!name) {
		return res.status(400).json('Name is required field.');
	}

	if (name && name.length > 255) {
		return res.status(400).json('Name must not be greater than 255 character.');
	}

	const existTag = await db.query.tags.findFirst({
		where: and(eq(tags.userId, userId), eq(lower(tags.name), name.toLowerCase())),
	});

	if (existTag) {
		return res.status(400).json('A tag already exists with that name.');
	}

	const [tag] = await db
		.insert(tags)
		.values({
			userId: userId,
			name: name,
		})
		.returning();

	res.json(tag);
};

exports.put = async (req, res) => {
	const userId = req.user.sub;
	const tagId = req.params.tagId;
	const name = req.body.name;

	if (!name) {
		return res.status(400).json('Name is required field.');
	}

	if (name && name.length > 255) {
		return res.status(400).json('Name must not be greater than 255 character.');
	}

	const existTag = await db.query.tags.findFirst({
		where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
	});

	if (!existTag) {
		return res.status(404).json('Tag does not exist.');
	}

	const existName = await db.query.tags.findFirst({
		where: and(
			eq(tags.userId, userId),
			eq(lower(tags.name), name.toLowerCase()),
			ne(tags.id, tagId),
		),
	});

	if (existName) {
		return res.status(400).json('A tag already exists with that name.');
	}

	const [tag] = await db
		.update(tags)
		.set({ name: name, updatedAt: new Date() })
		.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
		.returning();

	res.json(tag);
};

exports.delete = async (req, res) => {
	const userId = req.user.sub;
	const tagId = req.params.tagId;
	const articleId = req.body.articleId;

	const tag = await db.query.tags.findFirst({
		where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
	});

	if (!tag) {
		return res.status(404).json('Tag does not exist.');
	}

	await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)));

	await db
		.update(stars)
		.set({
			tagIds: sql`${stars.tagIds} - ${tagId}`,
			updatedAt: new Date(),
		})
		.where(and(eq(stars.userId, userId), sql`${stars.tagIds} ? ${tagId}`));

	await db
		.delete(stars)
		.where(and(eq(stars.userId, userId), sql`jsonb_array_length(${stars.tagIds}) = 0`));

	if (articleId) {
		const star = await db.query.stars.findFirst({
			where: and(eq(stars.userId, userId), eq(stars.articleId, articleId)),
		});
		return res.json(star);
	}

	res.sendStatus(204);
};
