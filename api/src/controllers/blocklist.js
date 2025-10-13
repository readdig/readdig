import { db } from '../db';
import { blocklists } from '../db/schema';

exports.get = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const data = await db.select().from(blocklists);

	const obj = data.reduce((result, { key, blocklist }) => {
		result[key] = blocklist;
		return result;
	}, {});

	res.json(obj);
};

exports.put = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const data = req.body || {};
	if (!data.feedUrls && !data.imageUrls && !data.unsafeUrls) {
		return res.status(400).json('Missing required fields.');
	}

	if (data.feedUrls) {
		if (!Array.isArray(data.feedUrls)) {
			return res.status(400).json('Field feedUrls must be an array.');
		}

		await db
			.insert(blocklists)
			.values({
				key: 'feedUrls',
				blocklist: data.feedUrls,
			})
			.onConflictDoUpdate({
				target: [blocklists.key],
				set: {
					blocklist: data.feedUrls,
					updatedAt: new Date(),
				},
			});
	}

	if (data.unsafeUrls) {
		if (!Array.isArray(data.unsafeUrls)) {
			return res.status(400).json('Field unsafeUrls must be an array.');
		}

		await db
			.insert(blocklists)
			.values({
				key: 'unsafeUrls',
				blocklist: data.unsafeUrls,
			})
			.onConflictDoUpdate({
				target: [blocklists.key],
				set: {
					blocklist: data.unsafeUrls,
					updatedAt: new Date(),
				},
			});
	}

	if (data.imageUrls) {
		if (!Array.isArray(data.imageUrls)) {
			return res.status(400).json('Field imageUrls must be an array.');
		}

		await db
			.insert(blocklists)
			.values({
				key: 'imageUrls',
				blocklist: data.imageUrls,
			})
			.onConflictDoUpdate({
				target: [blocklists.key],
				set: {
					blocklist: data.imageUrls,
					updatedAt: new Date(),
				},
			});
	}

	res.sendStatus(204);
};
