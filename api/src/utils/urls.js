import normalize from 'normalize-url';

import { logger } from './logger';
import { isURL } from './validation';

const invalidExtensions = ['mp3', 'mp4', 'mov', 'm4a', 'mpeg', 'ico'];

export function resolveUrl(from, to) {
	return new URL(to, from).toString();
}

export function normalizeUrl(url, options) {
	url = url || '';
	try {
		if (url.startsWith('https:https://')) {
			url = url.replace('https:https://', 'https://');
		}
		return normalize(url, { stripWWW: false, defaultProtocol: 'https:', ...options });
	} catch {
		return url;
	}
}

export function isRelativeUrl(str) {
	return !(/^https?:\/\//i.test(str) || str.startsWith('//'));
}

export function isValidOGUrl(url) {
	if (!url) {
		return false;
	}
	if (!isURL(url)) {
		return false;
	}
	const invalid = invalidExtensions.some((extension) => {
		if (url.endsWith(`.${extension}`)) {
			return extension;
		}
	});
	if (invalid) {
		logger.warn(`Invalid file extension for url ${url}`);
		return false;
	}
	return true;
}

export function extractHostname(url, full) {
	let hostname = '';
	if (url) {
		const parsedUrl = new URL(normalizeUrl(url));
		hostname = resolveUrl(
			`${parsedUrl.protocol}//${parsedUrl.host}`,
			full ? parsedUrl.pathname : '',
		);
	}
	return hostname;
}

export function ensureEncoded(url) {
	if (url == decodeURI(url)) {
		return encodeURI(url);
	}
	return url;
}
