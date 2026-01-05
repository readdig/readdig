import moment from 'moment';
import { EventEmitter } from 'events';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { feeds } from '../db/schema';
import { logger } from '../utils/logger';
import { isFeedURL } from '../utils/feed';
import { ParseFeed } from '../parsers/feed';
import { ParseArticleType } from '../parsers/types';
import { upsertManyPosts } from '../utils/upsert';
import {
	addQueue,
	processQueue,
	shutdownQueue,
	getQueueStatus,
	addQueueStatus,
	removeQueueStatus,
} from '../utils/queue';

if (require.main === module) {
	EventEmitter.defaultMaxListeners = 128;

	logger.info('Starting the feed worker');
	processQueue('feed', 35, feedProcessor);
}

export async function feedProcessor(job) {
	logger.info(`Feed processing Id ${job.data.feed}`);

	try {
		await handleFeed(job);
	} catch (err) {
		const tags = { queue: 'feed' };
		const extra = { feed: job.data.feed };
		logger.error(
			`Feed job encountered an error ${JSON.stringify({
				err: err.message,
				tags,
				extra,
			})}`,
		);
	}

	logger.info(`Completed feed scraping for ${job.data.feed}`);
}

async function handleFeed(job) {
	const feedId = job.data.feed;

	if (!feedId) {
		logger.warn(`Feed job feedId is required fields for '${JSON.stringify(job.data)}'`);
		return;
	}

	await markDone(feedId);

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		logger.warn(`Feed with Id ${feedId} does not exist`);
		return;
	}

	if (feed.duplicateOfId) {
		logger.warn(
			`Feed with Id ${feedId} is a duplicate of ${feed.duplicateOfId}. Skipping`,
		);
		return;
	}

	let feedUrl = feed.feedUrl;
	let feedContent;
	try {
		logger.info(`Feed start scraping: '${feedUrl}'`);
		feedContent = await ParseFeed(feedUrl);
		await db
			.update(feeds)
			.set({ consecutiveScrapeFailures: 0 })
			.where(eq(feeds.id, feedId));
	} catch (err) {
		await db
			.update(feeds)
			.set({ consecutiveScrapeFailures: (feed.consecutiveScrapeFailures || 0) + 1 })
			.where(eq(feeds.id, feedId));
		logger.warn(`Feed request failed for URL ${feedUrl}, ${err.message}`);
		return;
	}

	if (!feedContent || feedContent.items.length === 0) {
		logger.warn(`Feed with Id ${feedId} is empty`);
		return;
	}

	if (feedContent.fingerprint && feedContent.fingerprint === feed.fingerprint) {
		logger.warn(`Feed with Id ${feedId} has same fingerprint as registered before`);
		return;
	}

	logger.info(`Updating ${feedContent.items.length} articles for feed ${feedId}`);

	const articleType = ParseArticleType(!feed.valid ? feedContent.type : feed.type);
	// Add Articles
	let articlesToUpsert = [];
	for (const article of feedContent.items) {
		articlesToUpsert.push({
			feedId: feedId,
			type: articleType,
			guid: article.guid,
			url: article.url,
			title: article.title,
			description: article.summary,
			content: article.content,
			attachments: article.attachments,
			fingerprint: article.fingerprint,
			images: {
				icon: article.image || '',
			},
			author: article.author,
			datePublished: article.datePublished,
			dateModified: article.dateModified,
		});
	}

	logger.info(`Starting the upsertManyPosts for feed with Id ${feedId}`);
	const updatedCount = await upsertManyPosts(feedId, articlesToUpsert);

	let updates = {
		images: feed.images,
		feedUrl: feed.feedUrl,
		feedUrls: feed.feedUrls,
	};

	if (feedContent.favicon && feedContent.favicon !== feed.images?.favicon) {
		updates.images = { ...updates.images, favicon: feedContent.favicon };
	}
	if (feedContent.icon && feedContent.icon !== feed.images?.icon) {
		updates.images = { ...updates.images, icon: feedContent.icon };
	}
	if (feedContent.title && feedContent.title !== feed.title) {
		updates.title = feedContent.title;
	}
	if (!feed.type && feedContent.type && feedContent.type !== feed.type) {
		updates.type = feedContent.type;
	}
	if (!feed.feedType && feedContent.feedType && feedContent.feedType !== feed.feedType) {
		updates.feedType = feedContent.feedType;
	}
	if (feed.feedUrl !== feedContent.feedUrl) {
		const checkNowFeedUrl = await isFeedURL(feedContent.feedUrl);
		if (!checkNowFeedUrl) {
			updates.feedUrl = feedContent.feedUrl;
		}
		const checkOriginFeedUrl = await isFeedURL(feed.feedUrl, feed.id);
		if (!checkOriginFeedUrl) {
			if (!updates.feedUrls) {
				updates.feedUrls = [feed.feedUrl];
			} else {
				updates.feedUrls.push(feed.feedUrl);
			}
		}
		if (updates.feedUrls) {
			updates.feedUrls = updates.feedUrls.filter(
				(a) => a && ![feedContent.feedUrl, updates.feedUrl].includes(a),
			);
			updates.feedUrls = [...new Set(updates.feedUrls)];
		}
	}

	await db
		.update(feeds)
		.set({
			...updates,
			url: feedContent.url,
			description: feedContent.description,
			language: feedContent.language,
			fingerprint: feedContent.fingerprint,
			datePublished: feedContent.datePublished,
			dateModified: feedContent.dateModified,
			valid: true,
		})
		.where(eq(feeds.id, feedId));

	logger.info(
		`Finished updating. ${updatedCount} out of ${feedContent.items.length} changed for feed with Id ${feedId}`,
	);

	if (updatedCount > 0) {
		const feeds = await getQueueStatus('og');
		const ids = feeds.map((v) => v);
		if (!ids.includes(feedId)) {
			await addQueueStatus('og', feedId);
			await addQueue('og', { feed: feedId });
			logger.info(`OG queue add. feed with id ${feedId}`);
		}

		// Add to fulltext queue if feed has fullText enabled
		if (feed.fullText) {
			const fulltextFeeds = await getQueueStatus('fulltext');
			const fulltextIds = fulltextFeeds.map((v) => v);
			if (!fulltextIds.includes(feedId)) {
				await addQueueStatus('fulltext', feedId);
				await addQueue('fulltext', { feed: feedId });
				logger.info(`Fulltext queue add. feed with id ${feedId}`);
			}
		}
	}
}

async function markDone(feedId) {
	await removeQueueStatus('feed', feedId);
	await db
		.update(feeds)
		.set({ lastScraped: moment().toDate() })
		.where(eq(feeds.id, feedId));
}

async function shutdown(signal) {
	logger.info(`Received ${signal}. Shutting down.`);
	try {
		await shutdownQueue('feed');
	} catch (err) {
		logger.error(`Failure during feed worker shutdown: ${err.message}`);
		process.exit(1);
	}
	process.exit(0);
}

async function failure(source, err) {
	logger.error(`Unhandled ${source}: ${err.stack}. Shutting down feed worker.`);
	try {
		await shutdownQueue('feed');
	} catch (err) {
		logger.error(`Failure during feed worker shutdown: ${err.message}`);
	}
	process.exit(1);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', failure.bind(null, 'promise rejection'));
process.on('uncaughtException', failure.bind(null, 'exception'));
