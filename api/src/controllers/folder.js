import { eq, like, asc, and, sql, ne, inArray } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { folders, follows } from '../db/schema';
import { isFeedId } from '../utils/feed';
import { isFolderId } from '../utils/folder';
import { isDataURL } from '../utils/validation';

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const feedId = decodeURIComponent(query.feedId || '').trim();
	const name = decodeURIComponent(query.name || '').trim();

	let whereConditions = [eq(folders.userId, userId)];

	if (name) {
		whereConditions.push(like(lower(folders.name), `%${name.trim().toLowerCase()}%`));
	}

	const data = await db
		.select({
			id: folders.id,
			userId: folders.userId,
			name: folders.name,
		})
		.from(folders)
		.leftJoin(
			follows,
			feedId
				? and(
						eq(folders.id, follows.folderId),
						eq(follows.userId, userId),
						eq(follows.feedId, feedId),
				  )
				: sql`false`,
		)
		.where(and(...whereConditions))
		.orderBy(
			feedId
				? sql`CASE WHEN ${follows.folderId} IS NOT NULL THEN 1 ELSE 0 END DESC`
				: null,
			asc(folders.name),
			asc(folders.id),
		)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const body = req.body || {};
	const feedIds = body.feedIds;
	const name = body.name;

	if (!name) {
		return res.status(400).json('Name is required field.');
	}

	if (name.length > 255) {
		return res.status(400).json('Name must not be greater than 255 character.');
	}

	const exists = await db.query.folders.findFirst({
		where: and(
			eq(folders.userId, userId),
			eq(lower(folders.name), name.trim().toLowerCase()),
		),
	});

	if (exists) {
		return res.status(400).json('A folder already exists with that name.');
	}

	const [folder] = await db
		.insert(folders)
		.values({
			userId: userId,
			name: name.trim(),
		})
		.returning();

	if (feedIds) {
		if (!(await isFeedId(feedIds))) {
			return res.status(400).json('Some wrong feed Id provided.');
		}

		await db
			.update(follows)
			.set({ folderId: folder.id, updatedAt: new Date() })
			.where(and(eq(follows.userId, userId), inArray(follows.feedId, feedIds)));
	}

	res.json(folder);
};

exports.put = async (req, res) => {
	const userId = req.user.sub;
	const folderId = req.params.folderId;

	const body = req.body || {};
	const data = {
		name: body.name,
		icon: body.icon,
	};

	const folder = await db.query.folders.findFirst({
		where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
	});

	if (!folder) {
		return res.status(404).json('Folder does not exist.');
	}

	let updataField = {};

	if (data.name) {
		if (data.name.length > 255) {
			return res.status(400).json('Name must not be greater than 255 character.');
		}

		const exists = await db.query.folders.findFirst({
			where: and(
				eq(folders.userId, userId),
				eq(lower(folders.name), data.name.trim().toLowerCase()),
				ne(folders.id, folderId),
			),
		});

		if (exists) {
			return res.status(400).json('A folder already exists with that name.');
		}

		updataField.name = data.name;
	}

	if (data.icon !== undefined) {
		if (data.icon !== '' && data.icon !== null) {
			if (!isDataURL(data.icon)) {
				return res.status(400).json('Invalid icon field.');
			}
		}

		updataField.icon = data.icon;
	}

	if (Object.keys(updataField).length > 0) {
		updataField.updatedAt = new Date();
		const [updated] = await db
			.update(folders)
			.set(updataField)
			.where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
			.returning();

		res.json(updated);
	} else {
		res.json(folder);
	}
};

exports.delete = async (req, res) => {
	const userId = req.user.sub;
	const folderIds = req.body.folderIds;
	const feedIds = req.body.feedIds;
	const unfollow = req.body.unfollow;

	if (!Array.isArray(folderIds) || folderIds.length === 0) {
		return res
			.status(400)
			.json('Field folderIds is required and must be a non-empty array.');
	}

	if (!(await isFolderId(userId, folderIds))) {
		return res.status(400).json('Some wrong folder Id provided.');
	}

	if (unfollow) {
		let whereConditions = [eq(follows.userId, userId)];

		if (folderIds && folderIds.length > 0) {
			whereConditions.push(inArray(follows.folderId, folderIds));
		}

		if (feedIds && feedIds.length > 0) {
			whereConditions.push(inArray(follows.feedId, feedIds));
		}

		await db.delete(follows).where(and(...whereConditions));
	}

	await db
		.update(follows)
		.set({ folderId: null, updatedAt: new Date() })
		.where(and(eq(follows.userId, userId), inArray(follows.folderId, folderIds)));

	await db
		.delete(folders)
		.where(and(eq(folders.userId, userId), inArray(folders.id, folderIds)));

	res.sendStatus(204);
};
