import { eq, and, sql, inArray } from 'drizzle-orm';

import { db } from '../db';
import { stars, articles, tags } from '../db/schema';

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const articleId = req.body.articleId;

	const article = await db.query.articles.findFirst({
		where: eq(articles.id, articleId),
	});

	if (!article) {
		return res.status(404).json('Article does not exist.');
	}

	const exists = await db.query.stars.findFirst({
		where: and(eq(stars.userId, userId), eq(stars.articleId, articleId)),
	});

	if (exists) {
		return res.status(400).json('Star already exists.');
	}

	await db.insert(stars).values({ userId: userId, articleId: articleId });

	res.sendStatus(204);
};

exports.put = async (req, res) => {
	const userId = req.user.sub;
	const articleId = req.params.articleId;
	const tagId = req.body.tagId;

	const existStar = await db.query.stars.findFirst({
		where: and(eq(stars.userId, userId), eq(stars.articleId, articleId)),
	});

	if (!existStar) {
		return res.status(404).json('Star does not exist.');
	}

	const existTag = await db.query.tags.findFirst({
		where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
	});

	if (!existTag) {
		return res.status(404).json('Tag does not exist.');
	}

	const hasTag = await db.query.stars.findFirst({
		where: and(
			eq(stars.userId, userId),
			eq(stars.articleId, articleId),
			sql`${stars.tagIds} ? ${tagId}`,
		),
	});

	let updateData;
	if (hasTag) {
		updateData = {
			tagIds: sql`${stars.tagIds} - ${tagId}`,
			updatedAt: new Date(),
		};
	} else {
		updateData = {
			tagIds: sql`jsonb_insert(${stars.tagIds}, '{-1}', ${JSON.stringify(tagId)})`,
			updatedAt: new Date(),
		};
	}

	const [star] = await db
		.update(stars)
		.set(updateData)
		.where(and(eq(stars.userId, userId), eq(stars.articleId, articleId)))
		.returning();

	let tagsDetails = [];
	if (star.tagIds && Array.isArray(star.tagIds) && star.tagIds.length > 0) {
		tagsDetails = await db
			.select({
				id: tags.id,
				name: tags.name,
			})
			.from(tags)
			.where(and(eq(tags.userId, userId), inArray(tags.id, star.tagIds)));
	}

	res.json({
		...star,
		tags: tagsDetails,
	});
};

exports.delete = async (req, res) => {
	const userId = req.user.sub;
	const articleId = req.params.articleId;

	const exists = await db.query.stars.findFirst({
		where: and(eq(stars.userId, userId), eq(stars.articleId, articleId)),
	});

	if (!exists) {
		return res.status(404).json('Star does not exist.');
	}

	await db
		.delete(stars)
		.where(and(eq(stars.userId, userId), eq(stars.articleId, articleId)));

	res.sendStatus(204);
};
