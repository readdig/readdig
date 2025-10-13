import moment from 'moment';
import { eq, and, inArray, ne, or, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { feeds } from '../db/schema';
import { logger } from '../utils/logger';
import { upsertManyPosts } from '../utils/upsert';
import { ParseArticleType } from '../parsers/types';
import { ParseFeed } from '../parsers/feed';

export function isFeedType(feedType) {
	return feedType ? ['rss', 'podcast'].includes(feedType.toLowerCase().trim()) : false;
}

export const isFeedId = async (feedIds) => {
	if (feedIds && feedIds.length) {
		const validIds = feedIds.filter((id) => id);
		if (validIds.length === 0) {
			return false;
		}

		const feedList = await db
			.select({ id: feeds.id })
			.from(feeds)
			.where(inArray(feeds.id, validIds));

		if (feedList.length !== validIds.length) {
			return false;
		}
		return true;
	}
	return false;
};

export const isFeedURL = async (feedUrl, neFeedId) => {
	if (feedUrl) {
		const conditions = [
			or(
				eq(feeds.feedUrl, feedUrl),
				sql`${feeds.feedUrls} @> ${JSON.stringify([feedUrl])}`,
			),
		];

		if (neFeedId) {
			conditions.push(ne(feeds.id, neFeedId));
		}

		const feed = await db.query.feeds.findFirst({
			where: and(...conditions),
		});

		if (!feed) {
			return false;
		}
	}
	return true;
};

export const findFeed = async (feedUrl) => {
	const feed = await db.query.feeds.findFirst({
		where: and(
			isNull(feeds.duplicateOfId),
			or(
				eq(feeds.feedUrl, feedUrl),
				sql`${feeds.feedUrls} @> ${JSON.stringify([feedUrl])}`,
			),
		),
	});

	return feed;
};

export const parseFeedFind = async (feedUrl) => {
	let feedContent, altFeed;
	try {
		feedContent = await ParseFeed(feedUrl);
		if (feedContent && feedContent.feedUrl !== feedUrl) {
			altFeed = await findFeed(feedContent.feedUrl);
		}
	} catch (err) {
		logger.error(err.message);
	}
	return { feedContent, altFeed };
};

export const createFeed = async (feedUrl, feedContent) => {
	let updates = {};
	if (!feedContent.title) {
		updates.title = 'UNTITLED';
	}
	if (feedContent.feedUrl !== feedUrl) {
		updates.feedUrl = feedContent.feedUrl;
		updates.feedUrls = [feedUrl];
	}

	// Create feed
	const [feed] = await db
		.insert(feeds)
		.values({
			type: feedContent.type,
			url: feedContent.url,
			feedUrl: feedUrl,
			feedType: feedContent.feedType,
			title: feedContent.title || 'UNTITLED',
			description: feedContent.description || '',
			language: feedContent.language || '',
			lastScraped: moment().toDate(),
			fingerprint: feedContent.fingerprint,
			images: {
				icon: feedContent.icon || '',
				favicon: feedContent.favicon || '',
			},
			datePublished: feedContent.datePublished,
			dateModified: feedContent.dateModified,
			featured: false,
			fullText: false,
			valid: true,
			consecutiveScrapeFailures: 0,
			...updates,
		})
		.returning();

	const feedId = feed.id;
	const articleType = ParseArticleType(feed.type);

	// Upsert articles
	let articleData = [];
	if (feedContent.items.length > 0) {
		for (const article of feedContent.items) {
			articleData.push({
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
		await upsertManyPosts(feedId, articleData);
	}

	return feed;
};
