import { dataUriToBuffer } from 'data-uri-to-buffer';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { feeds, articles } from '../db/schema';

import computeHash from '../utils/hash';
import download from '../utils/download';
import { thumbnail, svgIcon } from '../utils/thumbnail';
import { readStored } from '../utils/storage';
import { isBlockedImageURL } from '../utils/blocklist';
import { isDataURL } from '../utils/validation';

exports.feed = async (req, res) => {
	const id = req.params.feedId;
	const query = req.query || {};

	let width = parseInt(query.w || 256);
	width = width < 32 ? 32 : width;
	width = width > 256 ? 256 : width;

	let height = parseInt(query.h || 256);
	height = height < 32 ? 32 : height;
	height = height > 256 ? 256 : height;

	const data = await db.query.feeds.findFirst({
		where: eq(feeds.id, id),
		columns: {
			id: true,
			title: true,
			images: true,
		},
	});

	if (!data) {
		return res.status(404).json(`Feed does not exist.`);
	}

	const feedId = data.id;
	const feedTitle = data.title;
	const images = await imagesFilter(data.images);
	const keys = ['featured', 'icon', 'og', 'favicon'];
	const image = await findImageDownload(keys, images, feedId, 'feeds');

	await sendImage(res, image, width, height, feedTitle);
};

exports.article = async (req, res) => {
	const id = req.params.articleId;
	const query = req.query || {};

	let width = parseInt(query.w || 256);
	width = width < 32 ? 32 : width;
	width = width > 256 ? 256 : width;

	let height = parseInt(query.h || 256);
	height = height < 32 ? 32 : height;
	height = height > 256 ? 256 : height;

	const data = await db.query.articles.findFirst({
		where: eq(articles.id, id),
		columns: {
			id: true,
			author: true,
			images: true,
		},
		with: {
			feed: {
				columns: {
					id: true,
					title: true,
					images: true,
				},
			},
		},
	});

	if (!data) {
		return res.status(404).json(`Article does not exist.`);
	}

	const feedId = data.feed.id;
	const feedTitle = data.feed.title;
	const feedImages = await imagesFilter(data.feed.images);
	const images = await imagesFilter(data.images);
	if (data.author && data.author.avatar) {
		images['avatar'] = data.author.avatar;
	}

	const keys = ['avatar', 'featured', 'icon', 'og', 'favicon'];
	let image = await findImageDownload(keys, images, feedId, 'articles');
	if (!image) {
		image = await findImageDownload(keys, feedImages, feedId, 'feeds');
	}

	await sendImage(res, image, width, height, feedTitle);
};

async function findImageDownload(keys, images, feedId, folder) {
	let image;
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const url = images[key];
		if (url) {
			if (isDataURL(url)) {
				image = url;
			} else {
				const hash = computeHash(url);
				image = await download(url, key, hash, feedId, folder);
			}
			if (image) {
				break;
			}
		}
	}
	return image;
}

// Rewrite emoji-only favicon SVGs so a single emoji glyph is centered/scaled.
function rewriteEmojiSvg(data) {
	const emojiRegex =
		/<text[^>]*>(?:[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}])<\/text>/u;
	if (!emojiRegex.test(data)) {
		return data;
	}
	return data
		.replace("width='48' height='48'", '')
		.replace("viewBox='0 0 16 16'", "viewBox='0 0 24 24'")
		.replace(
			"<text x='0' y='14'>",
			"<text x='50%' y='50%' alignment-baseline='middle' text-anchor='middle'>",
		);
}

async function sendImage(res, image, width, height, feedTitle) {
	// Data URLs are served inline.
	if (image && isDataURL(image)) {
		const img = dataUriToBuffer(image);
		res.type(img.typeFull);
		return res.end(Buffer.from(img.buffer));
	}

	// Stored image (R2 or local disk): read the bytes once, then process by type.
	let buffer = null;
	if (image) {
		try {
			buffer = await readStored(image);
		} catch (err) {
			buffer = null;
		}
	}

	if (buffer) {
		const ext = image.substring(image.lastIndexOf('.') + 1);
		if (ext === 'svg') {
			res.type(ext);
			return res.send(rewriteEmojiSvg(buffer.toString('utf8')));
		}
		if (['ico', 'cur', 'bmp'].includes(ext)) {
			res.type(ext);
			return res.end(buffer);
		}
		try {
			res.type(ext);
			return res.end(await thumbnail(buffer, width, height));
		} catch (err) {
			// fall through to the placeholder
		}
	}

	// Placeholder generated from the feed title.
	res.type('svg');
	res.end(svgIcon(feedTitle));
}

async function imagesFilter(images) {
	for (const key in images) {
		if (await isBlockedImageURL(images[key])) {
			images[key] = '';
		}
	}

	return images;
}
