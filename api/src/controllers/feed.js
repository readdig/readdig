import { eq, like, desc, asc, and, sql, or, ne, isNull, inArray } from 'drizzle-orm';
import moment from 'moment';
import opmlGenerator from 'opml-generator';
import { sort } from 'fast-sort';

import { config } from '../config';
import { db } from '../db';
import { lower } from '../db/lower';
import { feeds, articles } from '../db/schema';
import { isURL, isUUID } from '../utils/validation';
import { normalizeUrl } from '../utils/urls';
import { isBlockedFeedURL } from '../utils/blocklist';
import { isFeedType, findFeed, createFeed, parseFeedFind } from '../utils/feed';
import { ParseFeedType, ParseArticleType } from '../parsers/types';
import { DiscoverFeed } from '../parsers/discovery';
import { addQueue, addQueueStatus } from '../utils/queue';

exports.list = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const query = req.query || {};
	const limit = parseInt(query.per_page || 20);
	const offset = (parseInt(query.page || 1) - 1) * limit;
	const sortBy = (query.sort_by || 'createdAt,-1').split(',');
	const searchText = decodeURIComponent(query.q || '').trim();

	let orderBy = desc(feeds.createdAt);
	if (sortBy.length === 2) {
		const sortKey = sortBy[0].trim();
		const sortValue = sortBy[1].trim() || -1;
		if (sortKey && feeds[sortKey]) {
			orderBy = sortValue === 1 ? asc(feeds[sortKey]) : desc(feeds[sortKey]);
		}
	}

	let whereConditions = [];
	if (isURL(searchText)) {
		const searchUrl = normalizeUrl(searchText, { stripProtocol: true });
		whereConditions.push(
			or(
				like(lower(feeds.url), `%${searchUrl.toLowerCase()}%`),
				like(lower(feeds.feedUrl), `%${searchUrl.toLowerCase()}%`),
				sql`${feeds.feedUrls} ? ${searchUrl}`,
			),
		);
	} else if (isUUID(searchText)) {
		whereConditions.push(eq(feeds.id, searchText));
	} else if (searchText) {
		const searchWords = searchText
			.trim()
			.split(' ')
			.filter((s) => s)
			.map((word) => like(lower(feeds.title), `%${word.toLowerCase()}%`));

		if (searchWords.length > 0) {
			whereConditions.push(or(...searchWords));
		}
	}

	const data = await db
		.select({
			id: feeds.id,
			duplicateOfId: feeds.duplicateOfId,
			title: feeds.title,
			url: feeds.url,
			feedUrl: feeds.feedUrl,
			feedUrls: feeds.feedUrls,
			feedType: feeds.feedType,
			canonicalUrl: feeds.canonicalUrl,
			type: feeds.type,
			description: feeds.description,
			images: feeds.images,
			featured: feeds.featured,
			fullText: feeds.fullText,
			datePublished: feeds.datePublished,
			dateModified: feeds.dateModified,
			likes: feeds.likes,
			valid: feeds.valid,
			language: feeds.language,
			fingerprint: feeds.fingerprint,
			lastScraped: feeds.lastScraped,
			scrapeInterval: feeds.scrapeInterval,
			consecutiveScrapeFailures: feeds.consecutiveScrapeFailures,
			createdAt: feeds.createdAt,
			updatedAt: feeds.updatedAt,
			postCount: sql`COALESCE((SELECT COUNT(*) FROM articles WHERE feed_id = feeds.id), 0)`,
			followerCount: sql`COALESCE((SELECT COUNT(*) FROM follows WHERE feed_id = feeds.id), 0)`,
		})
		.from(feeds)
		.where(whereConditions.length > 0 ? or(...whereConditions) : undefined)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset);

	res.json(data);
};

exports.get = async (req, res) => {
	const feedId = req.params.feedId;

	if (!isUUID(feedId)) {
		return res.status(400).json(`Feed ID (${feedId}) is an invalid ObjectId.`);
	}

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		return res.status(404).json(`Feed does not exist.`);
	}

	res.json(feed);
};

exports.post = async (req, res) => {
	const data = req.body || {};
	let normalizedUrl = normalizeUrl(data.feedUrl);

	if (!isURL(normalizedUrl)) {
		return res.status(400).json('Please provide a valid feed URL.');
	}

	if (await isBlockedFeedURL(normalizedUrl)) {
		return res.status(400).json('This feed can not be added.');
	}

	const altFeed = await findFeed(normalizedUrl);
	if (altFeed) {
		return res.json(altFeed);
	}

	let feed = await parseFeedFind(normalizedUrl);
	if (feed.altFeed) {
		return res.json(feed.altFeed);
	}

	if (!feed.feedContent) {
		normalizedUrl = await DiscoverFeed(normalizedUrl);
		if (normalizedUrl) {
			if (await isBlockedFeedURL(normalizedUrl)) {
				return res.status(400).json('This feed can not be added.');
			}

			const altFeed = await findFeed(normalizedUrl);
			if (altFeed) {
				return res.json(altFeed);
			}

			feed = await parseFeedFind(normalizedUrl);
			if (feed.altFeed) {
				return res.json(feed.altFeed);
			}
		}
	}

	if (!feed.feedContent) {
		return res.status(404).json("We couldn't find that feed URL. ");
	}

	const newFeed = await createFeed(normalizedUrl, feed.feedContent);
	if (newFeed) {
		if (await addQueueStatus('og', newFeed.id)) {
			await addQueue('og', { feed: newFeed.id });
		}
	}

	return res.json(newFeed);
};

exports.put = async (req, res) => {
	const feedId = req.params.feedId;
	const data = req.body || {};

	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	if (!isUUID(feedId)) {
		return res.status(400).json(`Feed ID (${feedId}) is an invalid ObjectId.`);
	}

	let feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		return res.status(404).json(`Feed does not exist.`);
	}

	if (data.type) {
		if (!isFeedType(data.type)) {
			return res.status(400).json('Invalid feed type.');
		}
		data.type = ParseFeedType(data.type);
		const articleType = ParseArticleType(data.type);
		await db
			.update(articles)
			.set({ type: articleType, updatedAt: new Date() })
			.where(eq(articles.feedId, feedId));
	}

	if (data.feedUrl && !feed.duplicateOfId) {
		const normalizedUrl = normalizeUrl(data.feedUrl);
		if (!isURL(normalizedUrl) || (await isBlockedFeedURL(normalizedUrl))) {
			return res.status(400).json('Please provide a valid feed URL.');
		}

		const exist = await db.query.feeds.findFirst({
			where: and(
				ne(feeds.id, feedId),
				sql`${feeds.duplicateOfId} IS NULL`,
				or(eq(feeds.feedUrl, normalizedUrl), sql`${feeds.feedUrls} ? ${normalizedUrl}`),
			),
		});

		if (exist) {
			return res.status(400).json(`Feed URL already exists.`);
		}
	} else {
		delete data.feedUrl;
	}

	if (data.feedUrls && data.feedUrls.length > 0) {
		const exist = await db.query.feeds.findFirst({
			where: and(
				ne(feeds.id, feedId),
				isNull(feeds.duplicateOfId),
				or(
					inArray(feeds.feedUrl, data.feedUrls),
					sql`${feeds.feedUrls} ?| array[${sql.join(
						data.feedUrls.map((url) => sql`${url}`),
						sql`, `,
					)}]`,
				),
			),
		});

		if (exist) {
			return res.status(400).json(`Feed URLs already exists.`);
		}
	}

	const [updatedFeed] = await db
		.update(feeds)
		.set(data)
		.where(eq(feeds.id, feedId))
		.returning();

	res.json(updatedFeed);
};

exports.delete = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const feedId = req.params.feedId;

	if (!isUUID(feedId)) {
		return res.status(400).json(`Feed ID ${feedId} is an invalid ObjectId.`);
	}

	const feed = await db.query.feeds.findFirst({
		where: eq(feeds.id, feedId),
	});

	if (!feed) {
		return res.status(404).json(`Feed does not exist.`);
	}

	const duplicate = await db.query.feeds.findFirst({
		where: eq(feeds.duplicateOfId, feed.id),
	});

	if (duplicate) {
		return res.status(400).json(`Please delete the duplicate feed first.`);
	}

	await db.delete(feeds).where(eq(feeds.id, feed.id));

	res.sendStatus(204);
};

exports.merge = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const data = req.body || {};
	const lFeedId = data.lFeedId;
	const rFeedId = data.rFeedId;

	if (!lFeedId || !rFeedId) {
		return res.status(403).json('You must provide valid feed Id to perform this action.');
	}

	await mergeFeeds(lFeedId, rFeedId);

	res.sendStatus(204);
};

exports.opml = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const header = {
		dateCreated: moment().toISOString(),
		ownerName: req.User.name,
		title: `All Feeds in ${config.product.name}`,
	};

	const allFeeds = await db
		.select({
			id: feeds.id,
			title: feeds.title,
			feedUrl: feeds.feedUrl,
			url: feeds.url,
			type: feeds.type,
		})
		.from(feeds)
		.where(and(isNull(feeds.duplicateOfId), eq(feeds.valid, true)))
		.orderBy(feeds.title);

	const outlines = sort(
		allFeeds.map((feed) => ({
			text: feed.title,
			title: feed.title,
			type: feed.type || '',
			htmlUrl: feed.url || '',
			xmlUrl: feed.feedUrl,
		})),
	).asc('title');

	const opml = opmlGenerator(header, outlines);

	res.set({
		'Content-Disposition': `attachment; filename="${config.product.name.toLowerCase()}-all-feeds.xml"`,
		'Content-Type': 'application/xml; charset=utf-8',
	});

	res.end(opml);
};
