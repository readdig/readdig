import { dataUriToBuffer } from 'data-uri-to-buffer';
import { eq } from 'drizzle-orm';
import mime from 'mime';

import { db } from '../db';
import { feeds, articles } from '../db/schema';

import computeHash from '../utils/hash';
import download from '../utils/download';
import { svgIcon } from '../utils/thumbnail';
import { readStored, r2Enabled, storedId } from '../utils/storage';
import { isBlockedImageURL } from '../utils/blocklist';
import { isDataURL } from '../utils/validation';
import { logger } from '../utils/logger';

exports.feed = async (req, res) => {
	const id = req.params.feedId;

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

	await sendImage(res, image, feedTitle);
};

exports.article = async (req, res) => {
	const id = req.params.articleId;

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

	await sendImage(res, image, feedTitle);
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
				if (r2Enabled) {
					const id = storedId(folder, feedId, `${key}-${hash}`);
					const stored = await readStoredSafe(id);
					if (stored) {
						image = { id, stored };
					} else {
						image = await download(url, key, hash, feedId, folder, {
							skipFind: true,
							returnStored: true,
						});
					}
				} else {
					image = await download(url, key, hash, feedId, folder);
				}
			}
			if (image) {
				break;
			}
		}
	}
	return image;
}

async function readStoredSafe(image) {
	try {
		return image ? await readStored(image) : null;
	} catch (err) {
		if (err?.$metadata?.httpStatusCode !== 404 && err?.name !== 'NoSuchKey') {
			logger.info(`Read stored image failed for ${image}, ${err.message}.`);
		}
		return null;
	}
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

function getStoredSuffix(stored, image) {
	if (stored?.contentType) {
		return mime.getExtension(stored.contentType);
	}
	const idx = image ? image.lastIndexOf('.') : -1;
	return idx >= 0 ? image.substring(idx + 1) : '';
}

function setStoredContentType(res, stored, suffix) {
	if (stored?.contentType) {
		res.set('Content-Type', stored.contentType);
		return;
	}
	res.type(suffix || 'application/octet-stream');
}

async function sendImage(res, image, feedTitle) {
	res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');

	// Data URLs are served inline.
	if (typeof image === 'string' && isDataURL(image)) {
		const img = dataUriToBuffer(image);
		res.type(img.typeFull);
		return res.end(Buffer.from(img.buffer));
	}

	// Stored image (R2 or local disk): read the bytes once, then process by type.
	let stored = null;
	let imageId = image;
	if (image?.stored) {
		stored = image.stored;
		imageId = image.id;
	} else if (image) {
		stored = await readStoredSafe(image);
	}

	if (stored?.buffer) {
		const buffer = stored.buffer;
		const ext = getStoredSuffix(stored, imageId);
		if (ext === 'svg') {
			setStoredContentType(res, stored, ext);
			return res.send(rewriteEmojiSvg(buffer.toString('utf8')));
		}
		if (['ico', 'cur', 'bmp'].includes(ext)) {
			setStoredContentType(res, stored, ext);
			return res.end(buffer);
		}
		setStoredContentType(res, stored, ext);
		return res.end(buffer);
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
