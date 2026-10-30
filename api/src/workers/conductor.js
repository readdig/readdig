import { db, client } from '../db';
import { feeds } from '../db/schema';
import { logger } from '../utils/logger';
import {
	addBulkQueue,
	addQueueStatus,
	getQueueStatus,
	removeExpiredQueueStatus,
} from '../utils/queue';

const conductorInterval = 120; // seconds
const queueStatusMaxAge = 6 * 60 * 60; // seconds
const normalScrapeInterval = 10; // minutes
const invalidScrapeInterval = 720; // minutes
const failureScrapeInterval = 10080; // minutes

let timeout = null;
let isRunning = false;
let isShuttingDown = false;

if (require.main === module) {
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
	process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
	process.on('uncaughtException', failure.bind(null, 'exception'));

	logger.info(
		`Starting the conductor... will conduct every ${conductorInterval} seconds`,
	);
	void forever();
}

/**
 * Run conductor periodically.
 * Start the next iteration after the current one completes.
 */
async function forever() {
	isRunning = true;

	try {
		await conduct();
		logger.info('Conductor iteration completed...');
	} catch (err) {
		logger.error(`Conductor broke down ${err.stack || err.message}`);
	} finally {
		isRunning = false;

		if (isShuttingDown) {
			process.exit(0);
		}

		timeout = setTimeout(() => {
			void forever();
		}, conductorInterval * 1000);
	}
}

async function getPublications(limit) {
	// Get feeds already in queue to exclude them (filter out empty strings)
	const feedIds = await getQueueStatus('feed');
	const queuedFeedIds = feedIds.filter((id) => id && id.trim() !== '');

	// Use a single SQL query with conditional exclusion
	// If array is empty, the condition will always be true and won't exclude anything
	const feedsToScrape = await client`
		WITH feed_schedule AS (
			SELECT
				id,
				last_scraped,
				CASE
					WHEN scrape_interval IS NOT NULL AND scrape_interval > 0
					THEN scrape_interval
					WHEN valid = true
						AND consecutive_scrape_failures >= 0
						AND consecutive_scrape_failures <= ${failureScrapeInterval / normalScrapeInterval}
						AND (scrape_interval IS NULL OR scrape_interval = 0)
					THEN ${normalScrapeInterval}
					WHEN valid = true
						AND consecutive_scrape_failures >= ${failureScrapeInterval / normalScrapeInterval + 1}
						AND (scrape_interval IS NULL OR scrape_interval = 0)
					THEN ${failureScrapeInterval}
					WHEN valid = false
					THEN ${invalidScrapeInterval}
					ELSE scrape_interval
				END AS calculated_interval
			FROM feeds
			WHERE duplicate_of_id IS NULL
				AND (${queuedFeedIds.length} = 0 OR id != ALL(${queuedFeedIds}))
		),
		feed_with_next_scrape AS (
			SELECT
				id,
				last_scraped + (calculated_interval || ' minutes')::INTERVAL AS next_scraped
			FROM feed_schedule
			WHERE last_scraped IS NOT NULL
		)
		SELECT id
		FROM feed_with_next_scrape
		WHERE next_scraped < NOW()
		ORDER BY next_scraped ASC
		LIMIT ${limit}
	`;

	return feedsToScrape;
}

/**
 * Remove stale queue status entries.
 * Jobs that never reach markDone (e.g. dropped after stalling) would otherwise
 * keep their feed out of scheduling until the next restart.
 */
async function removeExpiredQueueStatuses() {
	for (const queueName of ['feed', 'og', 'fulltext']) {
		const removed = await removeExpiredQueueStatus(
			queueName,
			queueStatusMaxAge,
		);

		if (removed > 0) {
			logger.info(
				`Conductor removed ${removed} expired ${queueName} queue status entries`,
			);
		}
	}
}

async function conduct() {
	await removeExpiredQueueStatuses();

	const total = await db.$count(feeds);

	// Never schedule more than 1/10 per minute interval
	const maxToSchedule = Math.max(200, Math.floor(total / 10 / 4));

	logger.info(
		`Conductor will schedule at most ${maxToSchedule} of feed ` +
			`to scrape per ${conductorInterval} seconds`,
	);

	// Find the publications that we need to update
	const publications = await getPublications(maxToSchedule);

	logger.info(`Conductor found ${publications.length} of feed to scrape`);

	if (publications.length > 0) {
		await addQueueStatus(
			'feed',
			publications.map((p) => p.id),
		);

		await addBulkQueue(
			'feed',
			publications.map((p) => ({ data: { feed: p.id } })),
		);
	}

	logger.info(
		`Processing complete! Will try again in ${conductorInterval} seconds...`,
	);
}

function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);

	isShuttingDown = true;

	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}

	if (isRunning) {
		logger.info('Waiting for current conductor iteration to finish...');
		return;
	}

	process.exit(0);
}

function failure(reason, err) {
	logger.error(
		`Unhandled ${reason}: ${err?.stack || err?.message || err}. Shutting down Conductor worker.`,
	);

	isShuttingDown = true;

	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}

	process.exit(1);
}
