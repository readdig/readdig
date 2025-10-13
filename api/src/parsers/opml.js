import util from 'util';
import strip from 'strip';
import opmlParser from 'node-opml-parser';
import { opmlToJSON } from 'opml-to-json';

import computeHash from '../utils/hash';
import { isURL } from '../utils/validation';
import { normalizeUrl } from '../utils/urls';
import { isBlockedFeedURL } from '../utils/blocklist';
import { ParseFeedType } from '../parsers/types';

export const ParseOPML = async (opml, folder) => {
	let feeds = [];
	let folders = [];

	let results = {};
	if (folder) {
		const parseFeeds = await util.promisify(opmlParser)(opml);
		results = { children: parseFeeds };
		folders.push(folder.name);
	} else {
		results = await opmlToJSON(opml);
	}

	for (const item of results.children) {
		if (item.children) {
			const name = strip(item.text || item.title);
			if (name && !folders.filter((f) => f === name).length > 0) {
				folders.push(name);
			}
			for (const folderItem of item.children) {
				if (folderItem) {
					const feed = await opmlFeed(folderItem);
					if (feed && !feeds.find((f) => f.feedUrl === feed.feedUrl)) {
						feed.folder = name;
						feeds.push(feed);
					}
					if (folderItem.children && folderItem.children.length > 0) {
						const folderFeeds = await opmlFeedChildren(folderItem.children, name, 3);
						if (folderFeeds && folderFeeds.length > 0) {
							feeds = feeds.concat(folderFeeds);
						}
					}
				}
			}
		} else {
			const feed = await opmlFeed(item);
			if (feed && !feeds.find((f) => f.feedUrl === feed.feedUrl)) {
				if (folder) {
					feed.folder = folder.name;
				}
				feeds.push(feed);
			}
		}
	}

	return { folders, feeds };
};

const opmlFeed = async (item) => {
	const title = strip(item.title || item.text);
	const url = normalizeUrl(item.htmlurl || item.url);
	const feedUrl = normalizeUrl(item.xmlurl || item.feedUrl);

	if (!title || !feedUrl || !isURL(feedUrl)) {
		return;
	}

	if (url && !isURL(url)) {
		return;
	}

	if (await isBlockedFeedURL(feedUrl)) {
		return;
	}

	const feed = {};
	feed.title = title;
	feed.url = url || '';
	feed.feedUrl = feedUrl;
	feed.type = ParseFeedType(item.type);
	feed.fingerprint = computeHash(feed.feedUrl);
	return feed;
};

const opmlFeedChildren = async (children, name, depth) => {
	let feeds = [];
	for (const item of children) {
		if (item.children) {
			if (depth) {
				feeds = feeds.concat(await opmlFeedChildren(item.children, name, depth - 1));
			}
		} else {
			const feed = await opmlFeed(item);
			if (feed && !feeds.find((f) => f.feedUrl === feed.feedUrl)) {
				feed.folder = name;
				feeds.push(feed);
			}
		}
	}
	return feeds;
};
