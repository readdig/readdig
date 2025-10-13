import { eq } from 'drizzle-orm';

import { db } from '../db';
import { articles, listens } from '../db/schema';

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const body = req.body || {};

	const data = {
		articleId: body.articleId,
		open: body.open,
		playing: body.playing,
		played: body.played || 0,
		duration: body.duration || 0,
	};

	const exists = await db.query.articles.findFirst({
		where: eq(articles.id, data.articleId),
	});
	if (!exists) {
		return res.status(404).json('Article does not exist.');
	}

	const [listen] = await db
		.insert(listens)
		.values({
			userId: userId,
			articleId: data.articleId,
			open: data.open,
			playing: data.playing,
			played: data.played,
			duration: data.duration,
		})
		.onConflictDoUpdate({
			target: [listens.userId, listens.articleId],
			set: {
				open: data.open,
				playing: data.playing,
				played: data.played,
				duration: data.duration,
				updatedAt: new Date(),
			},
		})
		.returning();

	res.json(listen);
};
