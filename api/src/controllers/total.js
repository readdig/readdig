import { eq, and, count, sql } from 'drizzle-orm';

import { db } from '../db';
import { follows, stars, reads, listens, feeds, articles, users } from '../db/schema';
import { queues } from '../utils/queue';
import { logger } from '../utils/logger';

exports.get = async (req, res) => {
	const userId = req.user.sub;

	const [primaryResult, starResult, recentReadResult, recentPlayedResult, feedResult] =
		await Promise.all([
			// Primary articles count - optimized with JOIN
			db
				.select({ count: count(articles.id) })
				.from(articles)
				.innerJoin(follows, eq(articles.feedId, follows.feedId))
				.where(and(eq(follows.userId, userId), eq(follows.primary, true)))
				.then((result) => result[0]?.count || 0),

			// Star count
			db
				.select({ count: count(stars.id) })
				.from(stars)
				.where(eq(stars.userId, userId))
				.then((result) => result[0]?.count || 0),

			// Recent read count
			db
				.select({ count: count(reads.id) })
				.from(reads)
				.where(and(eq(reads.userId, userId), eq(reads.view, true)))
				.then((result) => result[0]?.count || 0),

			// Recent played count
			db
				.select({ count: count(listens.id) })
				.from(listens)
				.where(eq(listens.userId, userId))
				.then((result) => result[0]?.count || 0),

			// Total feed count
			db
				.select({ count: count(feeds.id) })
				.from(feeds)
				.where(and(sql`${feeds.duplicateOfId} IS NULL`, eq(feeds.valid, true)))
				.then((result) => result[0]?.count || 0),
		]);

	res.json({
		primary: parseInt(primaryResult),
		star: parseInt(starResult),
		recentRead: parseInt(recentReadResult),
		recentPlayed: parseInt(recentPlayedResult),
		feed: parseInt(feedResult),
	});
};

exports.stats = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	try {
		// Feeds statistics
		const [feedsTotal, feedsValid, feedsInvalid, feedsFailure, feedsDuplicate] =
			await Promise.all([
				db.select({ count: count() }).from(feeds),
				db.select({ count: count() }).from(feeds).where(eq(feeds.valid, true)),
				db.select({ count: count() }).from(feeds).where(eq(feeds.valid, false)),
				db
					.select({ count: count() })
					.from(feeds)
					.where(sql`${feeds.consecutiveScrapeFailures} > 3`),
				db
					.select({ count: count() })
					.from(feeds)
					.where(sql`${feeds.duplicateOfId} IS NOT NULL`),
			]);

		// Articles statistics
		const [articlesTotal, articlesValid, articlesDuplicate] = await Promise.all([
			db.select({ count: count() }).from(articles),
			db
				.select({ count: count() })
				.from(articles)
				.where(sql`${articles.duplicateOfId} IS NULL`),
			db
				.select({ count: count() })
				.from(articles)
				.where(sql`${articles.duplicateOfId} IS NOT NULL`),
		]);

		// Users statistics - define active as users active in last 30 days
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		const [usersTotal, usersOnline, usersActive, usersInactive] = await Promise.all([
			db.select({ count: count() }).from(users),
			db
				.select({ count: count() })
				.from(users)
				.where(sql`${users.activeAt} > ${oneDayAgo.toISOString()}`),
			db
				.select({ count: count() })
				.from(users)
				.where(sql`${users.activeAt} > ${thirtyDaysAgo.toISOString()}`),
			db
				.select({ count: count() })
				.from(users)
				.where(sql`${users.activeAt} <= ${thirtyDaysAgo.toISOString()}`),
		]);

		res.json({
			feeds: {
				count: feedsTotal[0]?.count || 0,
				validCount: feedsValid[0]?.count || 0,
				invalidCount: feedsInvalid[0]?.count || 0,
				failureCount: feedsFailure[0]?.count || 0,
				duplicateOfCount: feedsDuplicate[0]?.count || 0,
			},
			articles: {
				count: articlesTotal[0]?.count || 0,
				validCount: articlesValid[0]?.count || 0,
				duplicateOfCount: articlesDuplicate[0]?.count || 0,
			},
			users: {
				count: usersTotal[0]?.count || 0,
				onlineCount: usersOnline[0]?.count || 0,
				activeCount: usersActive[0]?.count || 0,
				inactiveCount: usersInactive[0]?.count || 0,
			},
		});
	} catch (error) {
		logger.error('Stats query error:', error);
		res.status(500).json('Failed to fetch statistics');
	}
};

exports.monitoring = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	let queueFeed, queueOg;
	try {
		queueFeed = await queues.feed.getJobCounts();
		queueOg = await queues.og.getJobCounts();
	} catch (error) {
		logger.error('Queues error:', error);
	}

	res.json({ queue: { feed: queueFeed, og: queueOg } });
};
