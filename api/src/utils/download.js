import path from 'path';
import mime from 'mime';
import { promises as fs, existsSync } from 'fs';

import { config } from '../config';
import { logger } from './logger';
import request from './request';
import { thumbnail } from './thumbnail';
import normalizeType from './normalizeType';

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

const download = async (url, prefix, hash, dir, folder) => {
	if (!url || !dir) {
		return;
	}

	const basePath = config.static.path;
	const filename = `${prefix}${hash}`;
	const pathname = path.join(__dirname, basePath, folder, dir);
	const filePath = path.join(pathname, filename);

	try {
		const filenames = await fs.readdir(pathname);
		const existFile = filenames.filter((f) => f.startsWith(filename));
		if (existFile.length > 0) {
			return path.join(pathname, existFile[0]);
		}
	} catch (err) {
		if (!existsSync(pathname)) {
			await fs.mkdir(pathname, { recursive: true });
		}
	}

	let res, suffix, imageBuffer;
	try {
		res = await request(url);
		if (!res.ok) {
			return;
		}

		const contentType = normalizeType(res.headers.get('content-type'));
		const extension = contentType ? mime.getExtension(contentType.type) : '';
		if (!validExtensions.includes(extension)) {
			return;
		}

		imageBuffer = await res.buffer();
		const imageSize = imageBuffer.length;
		if (!imageSize) {
			return;
		}

		suffix = validExtensions.find((extension) => {
			if (url.endsWith(`.${extension}`)) {
				return extension;
			}
			return;
		});

		if (!suffix && extension) {
			suffix = extension;
		}

		if (!suffix) {
			return;
		}
	} catch (err) {
		logger.info(`Download failed for URL ${url}, ${err.message}.`);
		return;
	}

	let fileOut;
	const imagePath = `${filePath}.${suffix}`;

	try {
		if (!fileOut && !['ico', 'cur', 'svg', 'bmp'].includes(suffix)) {
			await thumbnail(imageBuffer, 256, 256, imagePath);
			fileOut = imagePath;
		}
	} catch (err) {
		logger.info(`Thumbnail failed for URL ${url}, ${err.message}.`);
	}

	try {
		if (!fileOut) {
			await fs.writeFile(imagePath, imageBuffer);
			fileOut = imagePath;
		}
	} catch (err) {
		logger.info(`Write image failed for URL ${url}, ${err.message}.`);
	}

	return fileOut;
};

export default download;
