import mime from 'mime';

import { logger } from './logger';
import request from './request';
import { thumbnail } from './thumbnail';
import normalizeType from './normalizeType';
import { findStored, putStored } from './storage';

const validExtensions = [
	'gif',
	'avif',
	'jpg',
	'jpeg',
	'jfif',
	'pjpeg',
	'pjp',
	'apng',
	'png',
	'tif',
	'tiff',
	'ico',
	'cur',
	'bmp',
	'svg',
	'webp',
];

// Fetch + validate the source image, returning { imageBuffer, suffix } or null.
const fetchImage = async (url) => {
	try {
		const res = await request(url);
		if (!res.ok) {
			return null;
		}

		const contentType = normalizeType(res.headers.get('content-type'));
		const extension = contentType ? mime.getExtension(contentType.type) : '';
		if (!validExtensions.includes(extension)) {
			return null;
		}

		const imageBuffer = Buffer.from(await res.arrayBuffer());
		if (!imageBuffer.length) {
			return null;
		}

		let suffix = validExtensions.find((ext) => url.endsWith(`.${ext}`));
		if (!suffix && extension) {
			suffix = extension;
		}
		if (!suffix) {
			return null;
		}

		return { imageBuffer, suffix };
	} catch (err) {
		logger.info(`Download failed for URL ${url}, ${err.message}.`);
		return null;
	}
};

// Download an image into storage (R2 or local disk) the first time it's needed,
// returning its storage id (R2 key or file path). Raster formats are stored as a
// 256px thumbnail; vector/icon formats are stored as-is.
const download = async (url, prefix, hash, dir, folder, options = {}) => {
	if (!url || !dir) {
		return;
	}

	const name = `${prefix}-${hash}`;

	if (!options.skipFind) {
		const existing = await findStored(folder, dir, name);
		if (existing) {
			return existing;
		}
	}

	const img = await fetchImage(url);
	if (!img) {
		return;
	}

	let buffer = img.imageBuffer;
	if (!['ico', 'cur', 'svg', 'bmp'].includes(img.suffix)) {
		try {
			buffer = await thumbnail(img.imageBuffer, 256, 256);
		} catch (err) {
			logger.info(`Thumbnail failed for URL ${url}, ${err.message}.`);
		}
	}

	try {
		const contentType = mime.getType(img.suffix) || 'application/octet-stream';
		const id = await putStored(folder, dir, name, img.suffix, buffer, contentType);
		if (options.returnStored) {
			return { id, stored: { buffer, contentType } };
		}
		return id;
	} catch (err) {
		logger.info(`Store image failed for URL ${url}, ${err.message}.`);
		return;
	}
};

export default download;
