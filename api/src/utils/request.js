import { fetch, Agent } from 'undici';

import { config } from '../config';
import { logger } from './logger';

const requestTTL = 15 * 1000;

async function readURL(url, options = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, requestTTL);

	const dispatcher = new Agent({
		connect: {
			rejectUnauthorized: false,
		},
		allowH2: true, // Optional: enable HTTP/2 if needed
	});

	try {
		return await fetch(url, {
			method: 'GET',
			signal: controller.signal,
			dispatcher,
			...options,
			headers: {
				'User-Agent': config.useragent,
				...options.headers,
			},
		});
	} catch (err) {
		throw err;
	} finally {
		clearTimeout(timeout);
	}
}

function readProxyURL(url) {
	return readURL(config.proxy.url, {
		method: 'POST',
		body: JSON.stringify({
			url: encodeURIComponent(url),
		}),
		headers: {
			'Content-Type': 'application/json',
			'X-PROXY-SECRET': config.proxy.secret,
		},
	});
}

async function requestURL(url) {
	const isProxy = config.proxy.url && config.proxy.secret;
	let retries = 2;
	for (;;) {
		try {
			let res;
			if (isProxy && retries < 2) {
				logger.info(`Request proxy for URL ${url}.`);
				res = await readProxyURL(url);
				res.uri = res.headers.get('x-request-url') || url;
			} else {
				res = await readURL(url);
				res.uri = res.url;
				if (isProxy && !res.ok && res.status !== 404) {
					throw new Error(`Bad status code: ${res.status}`);
				}
			}
			return res;
		} catch (err) {
			if (isProxy && retries === 2) {
				logger.warn(`Request failed for URL ${url}, ${err.message}. Retrying`);
				--retries;
			} else {
				retries = 0;
			}
			if (!retries) {
				throw err;
			}
		}
	}
}

export default requestURL;
