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
				.from(follows)
				.innerJoin(articles, eq(articles.feedId, follows.feedId))
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
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		const [feedsStats, articlesEstimate, usersStats] = await Promise.all([
			// Feeds: small table, real count is fine
			db
				.select({
					total: sql`COUNT(*)::int`,
					valid: sql`COUNT(*) FILTER (WHERE ${feeds.valid} = true)::int`,
					invalid: sql`COUNT(*) FILTER (WHERE ${feeds.valid} = false)::int`,
					failure: sql`COUNT(*) FILTER (WHERE ${feeds.consecutiveScrapeFailures} > 3)::int`,
					duplicate: sql`COUNT(*) FILTER (WHERE ${feeds.duplicateOfId} IS NOT NULL)::int`,
				})
				.from(feeds),

			// Articles: pg_class estimates for total/valid, indexed COUNT for duplicates
			db.execute(sql`
				SELECT
					(SELECT reltuples::bigint FROM pg_class WHERE relname = 'articles') AS total,
					(SELECT COUNT(*)::int FROM articles WHERE duplicate_of_id IS NOT NULL) AS duplicate
			`),

			// Users: small table, real count is fine
			db
				.select({
					total: sql`COUNT(*)::int`,
					online: sql`COUNT(*) FILTER (WHERE ${users.activeAt} > ${oneDayAgo.toISOString()})::int`,
					active: sql`COUNT(*) FILTER (WHERE ${users.activeAt} > ${thirtyDaysAgo.toISOString()})::int`,
					inactive: sql`COUNT(*) FILTER (WHERE ${users.activeAt} <= ${thirtyDaysAgo.toISOString()})::int`,
				})
				.from(users),
		]);

		const articlesRow = articlesEstimate.rows?.[0] || articlesEstimate[0] || {};
		const articlesTotal = Number(articlesRow.total) || 0;
		const articlesDuplicate = Number(articlesRow.duplicate) || 0;

		res.json({
			feeds: {
				count: feedsStats[0].total,
				validCount: feedsStats[0].valid,
				invalidCount: feedsStats[0].invalid,
				failureCount: feedsStats[0].failure,
				duplicateOfCount: feedsStats[0].duplicate,
			},
			articles: {
				count: articlesTotal,
				duplicateOfCount: articlesDuplicate,
			},
			users: {
				count: usersStats[0].total,
				onlineCount: usersStats[0].online,
				activeCount: usersStats[0].active,
				inactiveCount: usersStats[0].inactive,
			},
		});
	} catch (err) {
		logger.error('Stats query error:', err);
		res.status(500).json('Failed to fetch statistics');
	}
};

exports.monitoring = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	let queueFeed, queueOg, queueFulltext;
	try {
		queueFeed = await queues.feed.getJobCounts();
		queueOg = await queues.og.getJobCounts();
		queueFulltext = await queues.fulltext.getJobCounts();
	} catch (err) {
		logger.error('Queues error:', err);
	}

	res.json({ queue: { feed: queueFeed, og: queueOg, fulltext: queueFulltext } });
};
