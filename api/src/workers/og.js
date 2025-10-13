import { EventEmitter } from 'events';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { feeds } from '../db/schema';
import { logger } from '../utils/logger';
import { isValidOGUrl, normalizeUrl } from '../utils/urls';
import { processQueue, shutdownQueue, removeQueueStatus } from '../utils/queue';
import { ParseOG } from '../parsers/og';
import { isBlockedFeedURL } from '../utils/blocklist';

if (require.main === module) {
	EventEmitter.defaultMaxListeners = 128;

	logger.info('Starting the OG worker');
	processQueue('og', 35, ogProcessor);
}

export async function ogProcessor(job) {
	logger.info(`OG processing id ${job.data.feed}`);

	try {
		await handleOg(job);
	} catch (err) {
		const tags = { queue: 'og' };
		const extra = { feed: job.data.feed };
		logger.error(
			`OG job encountered an error ${JSON.stringify({
				err: err.message,
				tags,
				extra,
			})}`,
		);
	}

	logger.info(`Completed OG scraping for ${job.data.feed}`);
}

// Run the OG scraping job
async function handleOg(job) {
	const feedId = job.data.feed;

	if (!feedId) {
		logger.warn(`OG job feedId is required fields for '${JSON.stringify(job.data)}'`);
		return;
	}

	await markDone(feedId);

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		logger.warn(`OG feed not found for id: ${feedId}`);
		return;
	}

	const url = normalizeUrl(feed.url);
	if (!isValidOGUrl(url) || (await isBlockedFeedURL(url))) {
		logger.warn(`OG feed url invalid for id: ${feedId}, URL: ${url}`);
		return;
	}

	let feedOG = {};
	try {
		logger.info(`OG start scraping: '${url}'`);
		feedOG = await ParseOG(url);
		logger.info(`OG info ${JSON.stringify(feedOG)}`);
	} catch (err) {
		logger.warn(`OG request failed for URL '${url}': ${err.message}`);
		return;
	}

	const iconUrl = feedOG.icon;
	const faviconUrl = feedOG.favicon;
	const imageUrl = feedOG.image;
	const canonicalUrl = feedOG.canonicalUrl;

	if (!iconUrl && !faviconUrl && !imageUrl && !canonicalUrl) {
		logger.warn(`OG not found for id: ${feedId}`);
		return;
	}

	const updates = { canonicalUrl: feed.canonicalUrl, images: feed.images || {} };
	if (iconUrl && !updates.images.icon) {
		updates.images = { ...updates.images, icon: iconUrl };
	}
	if (faviconUrl && !updates.images.favicon) {
		updates.images = { ...updates.images, favicon: faviconUrl };
	}
	if (imageUrl && imageUrl !== updates.images.og) {
		updates.images = { ...updates.images, og: imageUrl };
	}
	if (canonicalUrl && canonicalUrl !== updates.canonicalUrl) {
		updates.canonicalUrl = canonicalUrl;
	}
	await db.update(feeds).set(updates).where(eq(feeds.id, feedId));
	logger.info(`OG stored feed for id: ${feedId}`);
}

async function markDone(feedId) {
	await removeQueueStatus('og', feedId);
}

async function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);
	try {
		await shutdownQueue('og');
	} catch (err) {
		logger.error(`Failure during OG worker shutdown: ${err.message}`);
		process.exit(1);
	}
	process.exit(0);
}

async function failure(reason, err) {
	logger.error(`Unhandled ${reason}: ${err.stack}. Shutting down OG worker.`);
	try {
		await shutdownQueue('og');
	} catch (err) {
		logger.error(`Failure during OG worker shutdown: ${err.message}`);
	}
	process.exit(1);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
process.on('uncaughtException', failure.bind(null, 'exception'));
