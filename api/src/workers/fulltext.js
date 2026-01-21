import { EventEmitter } from 'events';
import { eq, and, isNull, desc, gte } from 'drizzle-orm';

import { db } from '../db';
import { feeds, articles, contents } from '../db/schema';
import { logger } from '../utils/logger';
import { processQueue, shutdownQueue, removeQueueStatus } from '../utils/queue';
import { ParseContent } from '../parsers/content';

if (require.main === module) {
	EventEmitter.defaultMaxListeners = 128;

	logger.info('Starting the fulltext worker');
	processQueue('fulltext', 10, fulltextProcessor);
}

export async function fulltextProcessor(job) {
	logger.info(`Fulltext processing id ${job.data.feed}`);

	try {
		await handleFulltext(job);
	} catch (err) {
		const tags = { queue: 'fulltext' };
		const extra = { feed: job.data.feed };
		logger.error(
			`Fulltext job encountered an error ${JSON.stringify({
				err: err.stack || err.message,
				tags,
				extra,
			})}`,
		);
	} finally {
		await markDone(job.data.feed);
	}

	logger.info(`Completed fulltext scraping for ${job.data.feed}`);
}

// Run the fulltext scraping job
async function handleFulltext(job) {
	const feedId = job.data.feed;

	if (!feedId) {
		logger.warn(
			`Fulltext job feedId is a required field for '${JSON.stringify(job.data)}'`,
		);
		return;
	}

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		logger.warn(`Fulltext feed not found for id: ${feedId}`);
		return;
	}

	// Only process feeds with fullText enabled
	if (!feed.fullText) {
		logger.info(`Fulltext skipping feed ${feedId} - fullText not enabled`);
		return;
	}

	// Get recent articles without content (only last 24 hours to avoid processing historical data)
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const articlesToProcess = await db
		.select({
			id: articles.id,
			url: articles.url,
			title: articles.title,
		})
		.from(articles)
		.leftJoin(contents, eq(articles.id, contents.articleId))
		.where(
			and(
				eq(articles.feedId, feedId),
				gte(articles.createdAt, oneDayAgo),
				isNull(contents.id),
			),
		)
		.orderBy(desc(articles.createdAt));

	if (articlesToProcess.length === 0) {
		logger.info(`Fulltext no articles to process for feed ${feedId}`);
		return;
	}

	logger.info(
		`Fulltext processing ${articlesToProcess.length} articles for feed ${feedId}`,
	);

	let successCount = 0;
	let failCount = 0;

	for (const article of articlesToProcess) {
		if (!article.url) {
			logger.warn(`Fulltext article ${article.id} has no URL, skipping`);
			failCount++;
			continue;
		}

		// Skip XKCD as it doesn't work well with Readability
		if (article.url.indexOf('https://xkcd') === 0) {
			logger.info(`Fulltext skipping XKCD article ${article.id}`);
			continue;
		}

		try {
			logger.info(`Fulltext parsing article ${article.id}: ${article.url}`);
			const parsed = await ParseContent(article.url);

			if (parsed && parsed.title && parsed.content) {
				await db.insert(contents).values({
					url: article.url,
					articleId: article.id,
					title: parsed.title,
					excerpt: parsed.excerpt || '',
					content: parsed.content,
				});
				successCount++;
				logger.info(`Fulltext successfully parsed article ${article.id}`);
			} else {
				failCount++;
				logger.warn(`Fulltext failed to parse article ${article.id} - no valid content`);
			}
		} catch (err) {
			failCount++;
			logger.warn(`Fulltext failed to parse article ${article.id}: ${err.message}`);
		}
	}

	logger.info(
		`Fulltext finished processing feed ${feedId}: ${successCount} success, ${failCount} failed`,
	);
}

async function markDone(feedId) {
	await removeQueueStatus('fulltext', feedId);
}

async function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);
	try {
		await shutdownQueue('fulltext');
	} catch (err) {
		logger.error(`Failure during fulltext worker shutdown: ${err.message}`);
		process.exit(1);
	}
	process.exit(0);
}

async function failure(reason, err) {
	logger.error(`Unhandled ${reason}: ${err.stack}. Shutting down fulltext worker.`);
	try {
		await shutdownQueue('fulltext');
	} catch (err) {
		logger.error(`Failure during fulltext worker shutdown: ${err.message}`);
	}
	process.exit(1);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
process.on('uncaughtException', failure.bind(null, 'exception'));
