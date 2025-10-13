import { promises as fs } from 'fs';
import { dataUriToBuffer } from 'data-uri-to-buffer';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { feeds, articles } from '../db/schema';

import computeHash from '../utils/hash';
import download from '../utils/download';
import { thumbnail, svgIcon } from '../utils/thumbnail';
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

async function sendImage(res, image, width, height, feedTitle) {
	if (image) {
		if (isDataURL(image)) {
			const img = dataUriToBuffer(image);
			const imgBuffer = Buffer.from(img.buffer);
			res.type(img.typeFull);
			res.end(imgBuffer);
			return;
		} else {
			const imageExt = image.substring(image.lastIndexOf('.') + 1);
			if (!['ico', 'cur', 'svg', 'bmp'].includes(imageExt)) {
				try {
					const imageBuffer = await thumbnail(image, width, height);
					res.type(imageExt);
					res.end(imageBuffer);
					return;
				} catch (err) {
					// XXX
				}
			} else {
				if (imageExt === 'svg') {
					try {
						const data = await fs.readFile(image, 'utf8');
						let modifiedData = data;
						const emojiRegex =
							/<text[^>]*>(?:[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}])<\/text>/u;
						if (emojiRegex.test(data)) {
							modifiedData = modifiedData.replace("width='48' height='48'", '');
							modifiedData = modifiedData.replace(
								"viewBox='0 0 16 16'",
								"viewBox='0 0 24 24'",
							);
							modifiedData = modifiedData.replace(
								"<text x='0' y='14'>",
								"<text x='50%' y='50%' alignment-baseline='middle' text-anchor='middle'>",
							);
						}
						res.type(imageExt);
						res.send(modifiedData);
						return;
					} catch (err) {
						// XXX
					}
				}
				res.type(imageExt);
				res.sendFile(image);
				return;
			}
		}
	}

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
