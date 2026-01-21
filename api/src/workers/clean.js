import { client } from '../db';
import { logger } from '../utils/logger';

const conductorInterval = 30 * 60; // seconds
const BATCH_SIZE = 10000; // Process articles in batches

let timeout = null;

if (require.main === module) {
	logger.info(`Starting the clean... will conduct every ${conductorInterval} seconds`);
	forever();
}

function forever() {
	conduct()
		.then(() => {
			logger.info('Clean worker iteration completed...');
		})
		.catch((err) => {
			logger.error(`Clean worker broke down ${err.stack || err.message}`);
		});
	timeout = setTimeout(forever, conductorInterval * 1000);
}

async function conduct() {
	await cleanInvalidFeeds();
	await cleanOldArticles();
	logger.info(`Processing complete! Will try again in ${conductorInterval} seconds...`);
}

/**
 * Clean invalid feeds that are older than 6 months
 * Articles will be cascade deleted due to foreign key constraint
 */
async function cleanInvalidFeeds() {
	try {
		// Find invalid feeds older than 6 months
		const result = await client`
			WITH invalid_feeds AS (
				SELECT id
				FROM feeds
				WHERE valid = false
					AND created_at < NOW() - INTERVAL '6 months'
			)
			DELETE FROM feeds
			WHERE id IN (SELECT id FROM invalid_feeds)
			RETURNING id
		`;

		if (result.length > 0) {
			logger.info(`Clean worker deleted ${result.length} invalid feeds`);
			logger.info(
				`Associated articles, follows, reads, stars, and listens were cascade deleted`,
			);
		}
	} catch (err) {
		logger.error(`Error cleaning invalid feeds: ${err.stack || err.message}`);
	}
}

/**
 * Clean old articles (1+ years) that have no reads, stars, or listens
 * Process in batches to avoid memory issues
 */
async function cleanOldArticles() {
	try {
		let totalDeleted = 0;
		let batchDeleted = 0;

		do {
			// Find and delete old unused articles in batches
			const result = await client`
				WITH old_unused_articles AS (
					SELECT a.id
					FROM articles a
					WHERE a.created_at < NOW() - INTERVAL '1 year'
						AND NOT EXISTS (SELECT 1 FROM reads r WHERE r.article_id = a.id)
						AND NOT EXISTS (SELECT 1 FROM stars s WHERE s.article_id = a.id)
						AND NOT EXISTS (SELECT 1 FROM listens l WHERE l.article_id = a.id)
					ORDER BY a.created_at
					LIMIT ${BATCH_SIZE}
				),
				deleted_contents AS (
					DELETE FROM contents
					WHERE article_id IN (SELECT id FROM old_unused_articles)
					RETURNING article_id
				)
				DELETE FROM articles
				WHERE id IN (SELECT id FROM old_unused_articles)
				RETURNING id
			`;

			batchDeleted = result.length;
			totalDeleted += batchDeleted;

			if (batchDeleted > 0) {
				logger.info(
					`Clean worker deleted batch of ${batchDeleted} old articles (total: ${totalDeleted})`,
				);
			}
		} while (batchDeleted === BATCH_SIZE);

		if (totalDeleted > 0) {
			logger.info(
				`Clean worker completed: deleted ${totalDeleted} old articles and their contents`,
			);
		}
	} catch (err) {
		logger.error(`Error cleaning old articles: ${err.stack || err.message}`);
	}
}

function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);
	try {
		clearTimeout(timeout);
	} catch (err) {
		logger.error(`Failure during Clean worker shutdown: ${err.stack || err.message}`);
		process.exit(1);
	}
	process.exit(0);
}

function failure(reason, err) {
	logger.error(`Unhandled ${reason}: ${err.stack}. Shutting down Clean worker.`);
	try {
		clearTimeout(timeout);
	} catch (err) {
		logger.error(`Failure during Clean worker shutdown: ${err.stack || err.message}`);
	}
	process.exit(1);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
process.on('uncaughtException', failure.bind(null, 'exception'));
