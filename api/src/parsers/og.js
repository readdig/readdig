import * as htmlparser from 'htmlparser2';

import request from '../utils/request';
import { logger } from '../utils/logger';
import { isRelativeUrl, resolveUrl, normalizeUrl, extractHostname } from '../utils/urls';

const imageMap = {
	'twitter:image:src': 1,
	'twitter:image': 1,
	'og:image:secure_url': 1,
	'og:image:url': 1,
	'og:image': 1,
};

const imageClassMap = (hostname) => {
	const classMap = {
		w_face_radius: 'weibo.com',
	};
	let obj;
	for (const [key, value] of Object.entries(classMap)) {
		if (hostname.includes(value)) {
			if (!obj) obj = {};
			obj[key] = value;
		}
	}
	return obj;
};

const faviconMap = {
	'shortcut icon': 1,
	favicon: 1,
	'mask-icon': 1,
	icon: 1,
};

const iconMap = {
	'apple-touch-icon-precomposed': 1,
	'apple-touch-icon': 1,
};

const urlMap = {
	'twitter:url': 1,
	'og:url': 1,
	canonical: 1,
};

export const ParseOG = async (pageUrl) => {
	const response = await request(pageUrl);
	const result = await discoverFromHTML(response);
	return result;
};

function parseFavicon(name, attr, hostname, result) {
	if (!result.favicon) {
		if (name === 'link') {
			if (attr.href && attr.rel && attr.rel.toLowerCase() in faviconMap) {
				if (isRelativeUrl(attr.href)) {
					result.favicon = resolveUrl(hostname, attr.href);
				} else {
					result.favicon = normalizeUrl(attr.href);
				}
			}
		}
	}
	return result;
}

function parseIcon(name, attr, hostname, result) {
	if (!result.icon) {
		if (name === 'link') {
			if (attr.href && attr.rel && attr.rel.toLowerCase() in iconMap) {
				if (isRelativeUrl(attr.href)) {
					result.icon = resolveUrl(hostname, attr.href);
				} else {
					result.icon = normalizeUrl(attr.href);
				}
			}
		}
	}
	return result;
}

function parseImage(name, attr, hostname, result) {
	if (!result.image) {
		if (name === 'meta') {
			let a = attr.name && attr.name.toLowerCase();
			let b = attr.property && attr.property.toLowerCase();
			if (attr.content && (a in imageMap || b in imageMap)) {
				if (isRelativeUrl(attr.content)) {
					result.image = resolveUrl(hostname, attr.content);
				} else {
					result.image = normalizeUrl(attr.content);
				}
			}
		}
	}
	if (!result.image) {
		const classMap = imageClassMap(hostname);
		if (classMap && name === 'img') {
			if (attr.src && attr.class && attr.class.toLowerCase() in classMap) {
				if (isRelativeUrl(attr.src)) {
					result.image = resolveUrl(hostname, attr.src);
				} else {
					result.image = normalizeUrl(attr.src);
				}
			}
		}
	}
	return result;
}

function parseCanonicalUrl(name, attr, hostname, result) {
	if (!result.canonicalUrl) {
		if (name === 'meta') {
			let a = attr.name && attr.name.toLowerCase();
			let b = attr.property && attr.property.toLowerCase();

			if (attr.content && (a in urlMap || b in urlMap)) {
				if (isRelativeUrl(attr.content)) {
					result.canonicalUrl = resolveUrl(
						hostname,
						attr.content === 'undefined/' ? '/' : attr.content,
					);
				} else {
					result.canonicalUrl = normalizeUrl(attr.content);
				}
			}
		}
		if (name === 'link') {
			if (attr.href && attr.rel && attr.rel.toLowerCase() in urlMap) {
				if (isRelativeUrl(attr.href)) {
					result.canonicalUrl = resolveUrl(hostname, attr.href);
				} else {
					result.canonicalUrl = normalizeUrl(attr.href);
				}
			}
		}
	}
	return result;
}

async function discoverFromHTML(response) {
	return Promise.race([
		new Promise((resolve, reject) => {
			const requestTTL = 15 * 1000;
			setTimeout(reject, requestTTL, new Error('OG Response timeout.'));
		}),
		new Promise(async (resolve, reject) => {
			let html = '';
			let result = {};
			const url = response.uri;

			if (!response.ok) {
				logger.warn(`OG Request failed, status code: ${response.status}`);
			}

			try {
				html = await response.text();
			} catch (err) {
				logger.warn(`OG Response text failed, err: ${err.message}`);
			}

			const hostname = extractHostname(url);
			const parser = new htmlparser.Parser(
				{
					onopentag: function (name, attr) {
						if (name === 'link' || name === 'meta' || name === 'img') {
							for (const extractor of [
								parseCanonicalUrl,
								parseFavicon,
								parseIcon,
								parseImage,
							]) {
								result = Object.assign(result, extractor(name, attr, hostname, result));
							}
						}
					},
					onerror: function (err) {
						logger.warn(`OG HTML parser failed, err: ${err.message}`);
					},
				},
				{
					recognizeCDATA: true,
				},
			);

			parser.write(html);
			parser.end();

			if (!result.favicon) {
				result.favicon = resolveUrl(hostname, 'favicon.ico');
			}

			if (!result.canonicalUrl) {
				result.canonicalUrl = extractHostname(url, true);
			}

			resolve(result);
		}),
	]);
}
