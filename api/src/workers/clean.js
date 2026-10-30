import { client } from '../db';
import { logger } from '../utils/logger';

const conductorInterval = 60 * 60; // seconds
const BATCH_SIZE = 1000;
const MAX_BATCHES_PER_RUN = 20;

// Article retention period in months (default: 3)
const ARTICLE_RETENTION_MONTHS = Number(process.argv[2] ?? 3);

if (
	!Number.isSafeInteger(ARTICLE_RETENTION_MONTHS) ||
	ARTICLE_RETENTION_MONTHS < 1
) {
	throw new Error('Article retention months must be a positive integer');
}

let timeout = null;
let isShuttingDown = false;

if (require.main === module) {
	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
	process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
	process.on('uncaughtException', failure.bind(null, 'exception'));

	logger.info(
		`Starting the clean... will conduct every ${conductorInterval} seconds`,
	);
	logger.info(
		`Article retention period: ${ARTICLE_RETENTION_MONTHS} months`,
	);

	void forever();
}

/**
 * Run cleanup periodically.
 * Start the next iteration after the current one completes.
 */
async function forever() {
	try {
		await conduct();
		logger.info('Clean worker iteration completed...');
	} catch (err) {
		logger.error(`Clean worker broke down ${err.stack || err.message}`);
	} finally {
		if (!isShuttingDown) {
			timeout = setTimeout(() => {
				void forever();
			}, conductorInterval * 1000);
		}
	}
}

async function conduct() {
	await cleanInvalidFeeds();
	await cleanOldArticles();

	logger.info(
		`Processing complete! Will try again in ${conductorInterval} seconds...`,
	);
}

/**
 * Clean invalid feeds that are older than 6 months.
 * Articles and associated data are cascade deleted due to foreign key constraints.
 */
async function cleanInvalidFeeds() {
	try {
		const result = await client`
			WITH invalid_feeds AS (
				SELECT id
				FROM feeds
				WHERE created_at < NOW() - INTERVAL '6 months'
					AND (
						valid = false
						OR (
							featured = false
							AND (
								consecutive_scrape_failures > 1050
								AND NOT EXISTS (
									SELECT 1
									FROM follows f
									WHERE f.feed_id = feeds.id
								)
							)
						)
					)
			)
			DELETE FROM feeds
			WHERE id IN (SELECT id FROM invalid_feeds)
			RETURNING id
		`;

		if (result.length > 0) {
			logger.info(
				`Clean worker deleted ${result.length} invalid feeds`,
			);
			logger.info(
				'Associated articles, follows, reads, stars, and listens were cascade deleted',
			);
		}
	} catch (err) {
		logger.error(
			`Error cleaning invalid feeds: ${err.stack || err.message}`,
		);
	}
}

/**
 * Clean old articles based on the configured retention period.
 *
 * Eligible articles:
 * - Older than ARTICLE_RETENTION_MONTHS.
 * - Have no reads records with view = true or NULL.
 * - Have no stars, listens, or likes records.
 *
 * reads records with view = false are deleted together with the articles.
 */
async function cleanOldArticles() {
	try {
		let totalDeleted = 0;

		for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
			const result = await client.begin(async (tx) => {
				// Select eligible articles in batches.
				await tx`
					CREATE TEMP TABLE cleanup_batch ON COMMIT DROP AS
					SELECT a.id
					FROM articles a
					WHERE a.created_at < NOW() -
						(${ARTICLE_RETENTION_MONTHS} * INTERVAL '1 month')
						AND NOT EXISTS (
							SELECT 1
							FROM reads r
							WHERE r.article_id = a.id
								AND r.view IS DISTINCT FROM FALSE
						)
						AND NOT EXISTS (
							SELECT 1
							FROM stars s
							WHERE s.article_id = a.id
						)
						AND NOT EXISTS (
							SELECT 1
							FROM listens l
							WHERE l.article_id = a.id
						)
						AND NOT EXISTS (
							SELECT 1
							FROM likes lk
							WHERE lk.article_id = a.id
						)
					ORDER BY a.created_at, a.id
					LIMIT ${BATCH_SIZE}
				`;

				const [batchResult] = await tx`
					SELECT COUNT(*)::int AS count
					FROM cleanup_batch
				`;

				if (batchResult.count === 0) {
					return [];
				}

				// Delete associated contents first.
				await tx`
					DELETE FROM contents c
					USING cleanup_batch b
					WHERE c.article_id = b.id
				`;

				// Delete unread records (view = false).
				await tx`
					DELETE FROM reads r
					USING cleanup_batch b
					WHERE r.article_id = b.id
						AND r.view = FALSE
				`;

				// Delete articles last.
				return await tx`
					DELETE FROM articles a
					USING cleanup_batch b
					WHERE a.id = b.id
					RETURNING a.id
				`;
			});

			const batchDeleted = result.length;

			if (batchDeleted === 0) {
				break;
			}

			totalDeleted += batchDeleted;

			logger.info(
				`Clean worker deleted batch of ${batchDeleted} old articles (total: ${totalDeleted})`,
			);

			if (batchDeleted < BATCH_SIZE) {
				break;
			}

			if (batch === MAX_BATCHES_PER_RUN - 1) {
				logger.info(
					'Clean worker reached the batch limit; remaining eligible articles will be processed in the next iteration',
				);
			}
		}

		if (totalDeleted > 0) {
			logger.info(
				`Clean worker completed: deleted ${totalDeleted} old articles, their contents, and unread records`,
			);
		}
	} catch (err) {
		logger.error(
			`Error cleaning old articles: ${err.stack || err.message}`,
		);
	}
}

function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);

	isShuttingDown = true;

	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}

	process.exit(0);
}

function failure(reason, err) {
	logger.error(
		`Unhandled ${reason}: ${err?.stack || err?.message || err}. Shutting down Clean worker.`,
	);

	isShuttingDown = true;

	if (timeout) {
		clearTimeout(timeout);
		timeout = null;
	}

	process.exit(1);
}
