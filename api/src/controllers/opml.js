import moment from 'moment';
import { sort } from 'fast-sort';
import opmlGenerator from 'opml-generator';
import { eq, desc, and, sql, inArray, isNull } from 'drizzle-orm';

import { db } from '../db';
import { feeds, follows, folders, users } from '../db/schema';

import { config } from '../config';
import request from '../utils/request';
import { logger } from '../utils/logger';
import { ParseOPML } from '../parsers/opml';
import { isURL, isUUID } from '../utils/validation';
import { normalizeUrl } from '../utils/urls';

exports.get = async (req, res) => {
	const userId = req.user.sub;

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});
	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const header = {
		dateCreated: moment().toISOString(),
		ownerName: user.name,
		title: `Subscriptions in ${config.product.name}`,
	};

	const foldersData = await db
		.select({
			id: folders.id,
			name: folders.name,
		})
		.from(folders)
		.where(eq(folders.userId, userId))
		.orderBy(folders.name);

	const followsData = await db
		.select({
			feed: {
				id: feeds.id,
				title: feeds.title,
				feedUrl: feeds.feedUrl,
				url: feeds.url,
				type: feeds.type,
			},
			folder: {
				id: folders.id,
				name: folders.name,
			},
		})
		.from(follows)
		.leftJoin(feeds, eq(follows.feedId, feeds.id))
		.leftJoin(folders, eq(follows.folderId, folders.id))
		.where(eq(follows.userId, userId))
		.orderBy(desc(follows.folderId));

	const outlines = foldersData.map((folder) => {
		const obj = {
			text: folder.name,
			title: folder.name,
			_children: sort(
				followsData
					.filter((f) => f.folder && f.folder.id === folder.id)
					.map(({ feed }) => {
						return {
							text: feed.title,
							title: feed.title,
							type: feed.type || '',
							htmlUrl: feed.url || '',
							xmlUrl: feed.feedUrl,
						};
					}),
			).asc('title'),
		};
		return obj;
	});

	const noFolderFollows = sort(
		followsData
			.filter((f) => !f.folder)
			.map(({ feed }) => {
				return {
					text: feed.title,
					title: feed.title,
					type: feed.type || '',
					htmlUrl: feed.url || '',
					xmlUrl: feed.feedUrl,
				};
			}),
	).asc('title');

	const opml = opmlGenerator(header, outlines.concat(noFolderFollows));

	res.set({
		'Content-Disposition': `attachment; filename="${config.product.name.toLowerCase()}-opml.xml"`,
		'Content-Type': 'application/xml; charset=utf-8',
	});

	res.end(opml);
};

exports.post = async (req, res) => {
	const userId = req.user.sub;
	const data = req.body || {};
	const file = req.file;
	const url = data.url;
	const folderId = data.folderId;

	if (!file && !url) {
		return res.status(400).json('OPML URL or file is required.');
	}

	let content;
	if (url) {
		if (!isURL(normalizeUrl(url))) {
			return res.status(400).json('Invalid OPML URL.');
		}
		try {
			const response = await request(url);
			if (!response.ok) {
				return res.status(400).json('Invalid OPML URL.');
			}
			content = await response.text();
		} catch (err) {
			logger.error(err);
			return res.status(400).json('Invalid OPML URL.');
		}
	}

	if (file) {
		content = Buffer.from(file.buffer).toString('utf8');
	}

	let folder;
	if (folderId) {
		if (!isUUID(folderId)) {
			return res.status(400).json(`FolderID (${folderId}) is an invalid uuid.`);
		}
		folder = await db.query.folders.findFirst({
			where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
			columns: { id: true, name: true },
		});
		if (!folder) {
			return res.status(404).json('Folder does not exist.');
		}
	}

	let opml = {};
	try {
		opml = await ParseOPML(content, folder);
	} catch (err) {
		logger.error(err);
		return res.status(400).json('Invalid OPML file.');
	}

	const feedsData = opml.feeds;
	const foldersData = opml.folders;
	if (!foldersData.length && !feedsData.length) {
		return res.status(400).json('OPML no content.');
	}

	let folderMaps = {};
	let useFolders = [];
	if (foldersData.length > 0) {
		const existsFolders = await db
			.select({ name: folders.name })
			.from(folders)
			.where(and(eq(folders.userId, userId), inArray(folders.name, foldersData)));

		const existingFolderNames = existsFolders.map((f) => f.name);
		const newFolders = foldersData.filter((name) => !existingFolderNames.includes(name));

		if (newFolders.length > 0) {
			const folderInserts = newFolders.map((name) => ({
				userId: userId,
				name,
			}));
			await db.insert(folders).values(folderInserts);
		}

		useFolders = await db
			.select({ id: folders.id, name: folders.name })
			.from(folders)
			.where(and(eq(folders.userId, userId), inArray(folders.name, foldersData)));

		folderMaps = useFolders.reduce((result, { name, id }) => {
			result[name] = id;
			return result;
		}, {});
	}

	const feedUrls = feedsData.map((f) => f.feedUrl);

	const existFeeds = await db
		.select({
			id: feeds.id,
			feedUrl: feeds.feedUrl,
			feedUrls: feeds.feedUrls,
		})
		.from(feeds)
		.where(isNull(feeds.duplicateOfId));

	const existFeedUrls = [];
	for (const feed of existFeeds) {
		if (feedUrls.includes(feed.feedUrl)) {
			existFeedUrls.push(feed.feedUrl);
		}
		if (feed.feedUrls && Array.isArray(feed.feedUrls)) {
			for (const url of feed.feedUrls) {
				if (feedUrls.includes(url)) {
					existFeedUrls.push(url);
				}
			}
		}
	}

	const useFeeds = feedsData.filter((f) => !existFeedUrls.includes(f.feedUrl));

	// insert new feeds in batches
	if (useFeeds.length > 0) {
		const chunkSize = 1000;
		const feedInserts = useFeeds.map((feed) => ({
			type: feed.type,
			url: feed.url,
			title: feed.title,
			feedUrl: feed.feedUrl,
			fingerprint: feed.fingerprint,
			lastScraped: moment().subtract(12, 'hours').toDate(),
			featured: false,
			fullText: false,
			valid: false,
			consecutiveScrapeFailures: 0,
		}));

		for (let i = 0; i < feedInserts.length; i += chunkSize) {
			const batch = feedInserts.slice(i, i + chunkSize);
			await db.insert(feeds).values(batch);
		}
		logger.info(
			`Inserted ${feedInserts.length} new feeds in ${Math.ceil(
				feedInserts.length / chunkSize,
			)} batches`,
		);
	}

	const allFeedsList = await db
		.select({
			id: feeds.id,
			feedUrl: feeds.feedUrl,
			feedUrls: feeds.feedUrls,
		})
		.from(feeds)
		.where(isNull(feeds.duplicateOfId));

	const allFeeds = allFeedsList.filter((feed) => {
		if (feedUrls.includes(feed.feedUrl)) return true;
		if (feed.feedUrls && Array.isArray(feed.feedUrls)) {
			return feed.feedUrls.some((url) => feedUrls.includes(url));
		}
		return false;
	});

	const followfeeds = allFeeds.map((f) => f.id).filter((id) => id);

	if (followfeeds.length === 0) {
		logger.info('No valid feed IDs found for follows');
		res.json({ folders: useFolders, follows: [] });
		return;
	}

	const existFollowfeeds = await db
		.select({ feedId: follows.feedId })
		.from(follows)
		.where(and(eq(follows.userId, userId), inArray(follows.feedId, followfeeds)));

	const existFollowFeeds = existFollowfeeds.map((f) => f.feedId);
	const useFollowFeeds = allFeeds.filter((f) => !existFollowFeeds.includes(f.id));

	// insert new follows in batches
	if (useFollowFeeds.length > 0) {
		const chunkSize = 1000;
		const followInserts = useFollowFeeds.map((feed) => {
			const feedFolder = feedsData.find(
				(f) =>
					f.feedUrl === feed.feedUrl ||
					(feed.feedUrls && feed.feedUrls.includes(f.feedUrl)),
			);
			return {
				userId: userId,
				feedId: feed.id,
				folderId: feedFolder ? folderMaps[feedFolder.folder] : null,
			};
		});

		for (let i = 0; i < followInserts.length; i += chunkSize) {
			const batch = followInserts.slice(i, i + chunkSize);
			await db.insert(follows).values(batch);
		}
		logger.info(
			`Inserted ${followInserts.length} new follows in ${Math.ceil(
				followInserts.length / chunkSize,
			)} batches`,
		);
	}

	const resultFollows = await db
		.select({
			id: feeds.id,
			folderId: folders.id,
			primary: follows.primary,
			fullText: follows.fullText,
			alias: follows.alias,
			title: sql`CASE WHEN ${follows.alias} IS NOT NULL THEN ${follows.alias} ELSE ${feeds.title} END`,
			url: feeds.url,
			type: feeds.type,
			valid: feeds.valid,
			postCount: sql`(SELECT COUNT(*)::int FROM articles WHERE feed_id = ${feeds.id})`,
		})
		.from(follows)
		.innerJoin(feeds, eq(follows.feedId, feeds.id))
		.leftJoin(folders, eq(follows.folderId, folders.id))
		.where(and(eq(follows.userId, userId), inArray(follows.feedId, followfeeds)));

	logger.info(
		`OPML response - folders: ${useFolders.length}, follows: ${resultFollows.length},`,
	);
	res.json({ folders: useFolders, follows: resultFollows });
};
