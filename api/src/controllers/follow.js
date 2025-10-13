import { eq, like, asc, and, sql, or, inArray } from 'drizzle-orm';

import { db } from '../db';
import { follows, feeds, folders } from '../db/schema';
import { isFeedId } from '../utils/feed';
import { isFolderId } from '../utils/folder';
import { getFollowDetails } from '../utils/follow';

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const title = decodeURIComponent(query.title || '').trim();

	let whereConditions = [eq(follows.userId, userId)];

	if (title) {
		whereConditions.push(
			or(
				like(
					sql`lower(CASE WHEN ${follows.alias} IS NOT NULL THEN ${follows.alias} ELSE ${feeds.title} END)`,
					`%${title.trim().toLowerCase()}%`,
				),
			),
		);
	}

	const data = await db
		.select({
			id: feeds.id,
			title: sql`CASE WHEN ${follows.alias} IS NOT NULL THEN ${follows.alias} ELSE ${feeds.title} END`,
		})
		.from(follows)
		.innerJoin(feeds, eq(follows.feedId, feeds.id))
		.where(and(...whereConditions))
		.orderBy(
			asc(
				sql`CASE WHEN ${follows.alias} IS NOT NULL THEN ${follows.alias} ELSE ${feeds.title} END`,
			),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.post = async (req, res) => {
	const body = req.body || {};
	const userId = req.user.sub;
	const feedId = body.feedId;
	const folderId = body.folderId;

	if (folderId) {
		const folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
		});
		if (!folder) {
			return res.status(404).json('Folder does not exist.');
		}
	}

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		return res.status(404).json('Feed does not exist.');
	}

	if (feed.duplicateOfId) {
		return res.status(400).json('Feed is a duplicate of, cannot subscribe.');
	}

	const [follow] = await db
		.insert(follows)
		.values({
			userId: userId,
			feedId: feedId,
			folderId: folderId || null,
		})
		.returning();

	const data = await getFollowDetails(follow.id);
	res.json(data);
};

exports.delete = async (req, res) => {
	const userId = req.user.sub;
	const feedIds = req.body.feedIds;

	if (!(await isFeedId(feedIds))) {
		return res.status(400).json('Some wrong feed Id provided.');
	}

	await db
		.delete(follows)
		.where(and(eq(follows.userId, userId), inArray(follows.feedId, feedIds)));

	res.sendStatus(204);
};

exports.put = async (req, res) => {
	const body = req.body || {};
	const userId = req.user.sub;
	const feedId = body.feedId;
	const alias = body.alias;
	const primary = body.primary;
	const fullText = body.fullText;

	let updataField = {};

	if (alias !== undefined) {
		if (alias && alias.length > 255) {
			return res.status(400).json('Name must not be greater than 255 character.');
		}
		updataField.alias = alias || null;
	}

	if (primary !== undefined && primary !== '') {
		if (!(primary === true || primary === false)) {
			return res.status(400).json('Field primary is an invalid bool.');
		}
		updataField.primary = primary;
	}

	if (fullText !== undefined && fullText !== '') {
		if (!(fullText === true || fullText === false)) {
			return res.status(400).json('Field fullText is an invalid bool.');
		}
		updataField.fullText = fullText;
	}

	if (!Object.keys(updataField).length) {
		return res.status(400).json('Missing required fields.');
	}

	updataField.updatedAt = new Date();

	const [follow] = await db
		.update(follows)
		.set(updataField)
		.where(and(eq(follows.userId, userId), eq(follows.feedId, feedId)))
		.returning();

	if (!follow) {
		return res.status(404).json('Follow relationship not found.');
	}

	const data = await getFollowDetails(follow.id);
	res.json(data);
};

exports.folder = async (req, res) => {
	const body = req.body || {};
	const userId = req.user.sub;
	const feedIds = body.feedIds;
	const folderId = body.folderId;

	if (!(await isFeedId(feedIds))) {
		return res.status(400).json('Some wrong feed Id provided.');
	}

	if (folderId && !(await isFolderId(userId, [folderId]))) {
		return res.status(404).json('Folder does not exist.');
	}

	await db
		.update(follows)
		.set({
			folderId: folderId || null,
			updatedAt: new Date(),
		})
		.where(and(eq(follows.userId, userId), inArray(follows.feedId, feedIds)));

	res.sendStatus(204);
};
