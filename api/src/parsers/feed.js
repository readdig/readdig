import strip from 'strip';
import moment from 'moment';
import FeedParser from 'feedparser';
import iconv from 'iconv-lite';
import { decodeHTML } from 'entities';
import ReadableStreamClone from 'readable-stream-clone';

import { logger } from '../utils/logger';
import request from '../utils/request';
import computeHash from '../utils/hash';
import normalizeType from '../utils/normalizeType';
import { normalizeUrl } from '../utils/urls';
import { FeedContentMakeUp, FeedArticleMakeUp } from './patch';

function safeParseDate(dateValue) {
	if (!dateValue) return new Date();

	if (dateValue instanceof Date) {
		return isNaN(dateValue.getTime()) ? new Date() : dateValue;
	}

	if (typeof dateValue === 'string' || typeof dateValue === 'number') {
		const momentDate = moment(dateValue);
		if (momentDate.isValid()) {
			return momentDate.toDate();
		}
	}

	return new Date();
}

export const ParseFeed = async (feedUrl, limit = 1000) => {
	logger.info(`Attempting to parse feed ${feedUrl}`);

	const response = await request(feedUrl);
	const posts = await ReadFeedResponse(response);

	let feedResponse;
	if (posts.feedType === 'xmlfeed') {
		feedResponse = ParseFeedPosts(posts, limit);
	}
	if (posts.feedType === 'jsonfeed') {
		feedResponse = ParseJSONPosts(posts, limit);
	}

	logger.info(`Finished to parse feed ${feedUrl}`);

	return feedResponse;
};

export function ComputePostHash(post) {
	const attachmentUrls = post.attachments.map((a) => a.url);
	const attachmentString = attachmentUrls.join(',') || '';
	const data = `${post.title}:${post.summary}:${post.content}:${attachmentString}`;
	return computeHash(data);
}

export function ComputePublicationHash(posts) {
	const fingerprints = posts.items
		.filter((p) => !!p.fingerprint)
		.map((p) => p.fingerprint.substring(0, 12));
	if (fingerprints.length != posts.items.length) {
		throw Error('Missing post fingerprints');
	}
	const data = fingerprints.join(',');
	return computeHash(data);
}

export function CreateFingerPrints(posts) {
	if (!posts) {
		return posts;
	}

	// compute the post fingerprint
	for (let post of posts.items) {
		post.fingerprint = ComputePostHash(post);
	}

	// compute the publication fingerprint
	posts.fingerprint = ComputePublicationHash(posts);

	return posts;
}

async function normalizeEncoding(responseStream, responseText, contentType) {
	let encoding, charset;

	if (responseText) {
		const xmlDeclaration = responseText.match(/^<\?xml .*\?>/);
		if (xmlDeclaration) {
			var encodingDeclaration = xmlDeclaration[0].match(/encoding=['"](.*?)['"]/);
			if (encodingDeclaration && encodingDeclaration[1]) {
				encoding = encodingDeclaration[1].toLowerCase();
			}
		}
	}

	const normalizedType = normalizeType(contentType);
	if (normalizedType && normalizedType.parameters && normalizedType.parameters.charset) {
		charset = normalizedType.parameters.charset.toLowerCase();
	}
	if (charset && charset !== encoding) {
		encoding = charset;
	}

	let iconvStream;
	if (!iconvStream && encoding && encoding !== 'utf-8') {
		try {
			iconvStream = iconv.decodeStream(encoding);
			iconvStream.on('error', (err) => logger.info(err));
			responseStream = responseStream.pipe(iconvStream);
		} catch (err) {
			responseStream.emit('error', err);
		}
	}

	return responseStream;
}

export function ReadFeedResponse(response) {
	return Promise.race([
		new Promise((resolve, reject) => {
			const requestTTL = 15 * 1000;
			setTimeout(reject, requestTTL, new Error('Response timeout.'));
		}),
		new Promise(async (resolve, reject) => {
			if (!response.ok) {
				reject(new Error(`${response.status} ${response.statusText}`));
			}

			const contentType = response.headers.get('content-type');
			const feedUrl = normalizeUrl(response.uri);

			if (contentType && contentType.toLowerCase().includes('json')) {
				try {
					const json = await response.json();
					if (typeof json === 'object') {
						let posts = json || {};
						posts.feedType = 'jsonfeed';
						posts.feedUrl = feedUrl;
						resolve(posts);
					} else {
						reject(new Error('Invalid JSONFeed.'));
					}
				} catch (err) {
					reject(err);
				}
			} else {
				let meta;
				let articles = [];

				const feedparser = new FeedParser();
				feedparser.on('error', reject);
				feedparser.on('meta', function (m) {
					meta = m;
				});
				feedparser.on('readable', function () {
					let item;
					while ((item = this.read())) {
						delete item.meta;
						articles.push(item);
					}
				});
				feedparser.on('end', function () {
					let posts = { ...meta };
					posts.items = articles;
					posts.feedType = 'xmlfeed';
					posts.feedUrl = feedUrl;
					resolve(posts);
				});

				try {
					let responseStream = new ReadableStreamClone(response.body);
					const responseText = await response.text();

					responseStream = await normalizeEncoding(
						responseStream,
						responseText,
						contentType,
					);
					responseStream.pipe(feedparser);
				} catch (err) {
					reject(err);
				}
			}
		}),
	]);
}

export function ParseFeedPosts(posts, limit = 1000) {
	let feedContent;

	if (posts) {
		if (
			!posts.link &&
			posts['atom:author'] &&
			posts['atom:author']['uri'] &&
			posts['atom:author']['uri']['#']
		) {
			posts.link = posts['atom:author']['uri']['#'];
		}
		if (!posts.link) {
			posts.link = posts.feedUrl;
		}
		if (!posts.title && !posts.description && (!posts.items || posts.items.length <= 1)) {
			throw Error('Invalid Feed URL.');
		}

		const pubDate = safeParseDate(posts.pubdate);
		const recentDate = safeParseDate(posts.date);
		feedContent = { items: [] };
		feedContent.version = 'https://jsonfeed.org/version/1';
		feedContent.feedType = posts.feedType;
		feedContent.url = normalizeUrl(posts.link);
		feedContent.feedUrl = posts.feedUrl;
		feedContent.title = strip(decodeHTML(posts.title || ''));
		feedContent.description = posts.description || '';
		feedContent.icon = posts.image ? normalizeUrl(posts.image.url) : '';
		feedContent.favicon = posts.favicon;
		feedContent.language = posts.language;
		feedContent.datePublished = pubDate;
		feedContent.dateModified = recentDate;

		for (let i in posts.items.slice(0, limit)) {
			const post = posts.items[i];
			let article;
			try {
				const url = normalizeUrl(post.link);
				const image = post.image ? normalizeUrl(post.image.url) : '';
				const author = post.author ? { name: post.author } : null;
				const pubDate = safeParseDate(post.pubdate);
				const recentDate = safeParseDate(post.date);

				let title = strip(decodeHTML(post.title || ''));
				if (title === 'null' || title === 'undefined') {
					title = '';
				}

				let summary = post.summary || post.description;
				if (
					!summary ||
					summary === 'null' ||
					summary === 'undefined' ||
					summary === '-'
				) {
					summary = '';
				}
				if (summary) {
					summary = strip(summary).substring(0, 200);
				}

				let content = post.description;
				if (!content || content === 'null' || content === 'undefined') {
					content = '';
				}

				if (!title || (!title && !summary && !content)) {
					logger.info('skipping article since there is no title summary and content');
					continue;
				}

				article = {
					id: post.guid,
					guid: post.guid,
					title: title,
					url: url,
					summary: summary,
					content: content,
					image: image,
					author: author,
					tags: post.categories,
					datePublished: pubDate,
					dateModified: recentDate,
					attachments: [],
				};
			} catch (err) {
				logger.info(`Skipping article, Error: ${err.message}`);
				continue;
			}

			if (article) {
				// fix article
				article = FeedArticleMakeUp(post, article);
				const exists = feedContent.items.filter((i) => i.id === article.id).length;
				if (!exists) {
					feedContent.items.push(article);
				}
			}
		}

		// fix feed content
		feedContent = FeedContentMakeUp(posts, feedContent);
		feedContent = CreateFingerPrints(feedContent);
	}
	return feedContent;
}

export function ParseJSONPosts(posts, limit = 1000) {
	let feedContent;

	if (posts) {
		if (posts.version && !posts.version.includes('jsonfeed.org')) {
			throw Error('Invalid Feed URL.');
		}
		if (!posts.home_page_url) {
			posts.home_page_url = posts.feedUrl;
		}
		if (!posts.title && !posts.description && (!posts.items || posts.items.length <= 1)) {
			throw Error('Invalid Feed URL.');
		}
		feedContent = { items: [] };
		feedContent.feedType = posts.feedType;
		feedContent.url = normalizeUrl(posts.home_page_url);
		feedContent.feedUrl = posts.feedUrl;
		feedContent.title = strip(decodeHTML(posts.title || ''));
		feedContent.description = posts.description || '';
		feedContent.icon = normalizeUrl(posts.icon);
		feedContent.favicon = normalizeUrl(posts.favicon);
		feedContent.author = posts.author;
		feedContent.language = posts.language;
		feedContent.nextUrl = normalizeUrl(posts.next_url);
		feedContent.datePublished = new Date();
		feedContent.dateModified = new Date();

		for (let i in posts.items.slice(0, limit)) {
			const post = posts.items[i];
			let article;
			try {
				const url = normalizeUrl(post.url);
				const pubDate = safeParseDate(post.date_published);
				const recentDate = safeParseDate(post.date_modified);

				let title = strip(decodeHTML(post.title || ''));
				if (title === 'null' || title === 'undefined') {
					title = '';
				}

				let summary = post.summary || post.content_html;
				if (
					!summary ||
					summary === 'null' ||
					summary === 'undefined' ||
					summary === '-'
				) {
					summary = '';
				}
				if (summary) {
					summary = strip(summary).substring(0, 200);
				}

				let content = post.content_html;
				if (!content || content === 'null' || content === 'undefined') {
					content = '';
				}

				if (!title || (!title && !summary && !content)) {
					logger.info('skipping article since there is no title summary and content');
					continue;
				}

				article = {
					id: post.id,
					guid: post.id,
					url: url,
					title: title,
					summary: summary,
					content: content,
					image: post.image,
					author: post.author,
					tags: post.tags,
					datePublished: pubDate,
					dateModified: recentDate,
					attachments: [],
				};
			} catch (err) {
				logger.info(`Skipping article, Error: ${err.message}`);
				continue;
			}

			if (article) {
				// fix article
				article = FeedArticleMakeUp(post, article);
				const exists = feedContent.items.filter((i) => i.id === article.id).length;
				if (!exists) {
					feedContent.items.push(article);
				}
			}
		}
		// fix feed content
		feedContent = FeedContentMakeUp(posts, feedContent);
		feedContent = CreateFingerPrints(feedContent);
	}
	return feedContent;
}
