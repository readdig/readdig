import * as htmlparser from 'htmlparser2';

import request from '../utils/request';
import { logger } from '../utils/logger';
import { isRelativeUrl, resolveUrl, normalizeUrl, extractHostname } from '../utils/urls';

const rssMap = {
	'application/rss+xml': 1,
	'application/atom+xml': 1,
	'application/rdf+xml': 1,
	'application/rss': 1,
	'application/atom': 1,
	'application/rdf': 1,
	'text/rss+xml': 1,
	'text/atom+xml': 1,
	'text/rdf+xml': 1,
	'text/rss': 1,
	'text/atom': 1,
	'text/rdf': 1,
};

export const DiscoverFeed = async (pageUrl) => {
	let result;
	try {
		const response = await request(pageUrl);
		result = await discoverFromHTML(response);
	} catch (err) {
		logger.error(err);
	}
	return result;
};

async function discoverFromHTML(response) {
	return Promise.race([
		new Promise((resolve, reject) => {
			const requestTTL = 15 * 1000;
			setTimeout(reject, requestTTL, new Error('Discovery Response timeout.'));
		}),
		new Promise(async (resolve, reject) => {
			let html = '';
			let result = '';

			if (!response.ok) {
				logger.warn(`Discovery Request failed, status code: ${response.status}`);
			}

			try {
				html = await response.text();
			} catch (err) {
				logger.warn(`Discovery Response text failed, err: ${err.message}`);
			}

			const hostname = extractHostname(response.uri);
			const parser = new htmlparser.Parser(
				{
					onopentag: function (name, attr) {
						if (name === 'link') {
							if (attr.href && attr.type && attr.type.toLowerCase() in rssMap) {
								if (isRelativeUrl(attr.href)) {
									result = normalizeUrl(resolveUrl(hostname, attr.href));
								} else {
									result = normalizeUrl(attr.href);
								}
							}
						}
					},
					onerror: function (err) {
						logger.warn(`Discovery HTML parser failed, err: ${err.message}`);
					},
				},
				{
					recognizeCDATA: true,
				},
			);

			parser.write(html);
			parser.end();

			resolve(result);
		}),
	]);
}
