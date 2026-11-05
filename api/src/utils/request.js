import { fetch, Agent } from 'undici';

import { config } from '../config';
import { logger } from './logger';

const requestTTL = 15 * 1000;

function isBlockedByShield(res) {
	if (!res) return false;
	if (res.headers && res.headers.get('cf-mitigated') === 'challenge') {
		return true;
	}
	// 403 (Forbidden), 503 (Service Unavailable), 567 (EdgeOne Challenge)
	return [403, 503, 567].includes(res.status);
}

// 1. 直连通道 (Native fetch)
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

// 2. Cloudflare Worker 代理通道
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

// 3. FlareSolverr 解盾通道（单独封装）
async function readSolverURL(url, options = {}) {
	logger.info(`Request solver for URL ${url}.`);
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, 60 * 1000);

	try {
		const flareRes = await fetch(config.flaresolverr.url, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				cmd: 'request.get',
				url: url,
				maxTimeout: 55000,
			}),
		});

		if (!flareRes.ok) {
			throw new Error(`FlareSolverr service returned status ${flareRes.status}`);
		}

		const data = await flareRes.json();
		if (data.status !== 'ok') {
			throw new Error(data.message || 'FlareSolverr challenge failed');
		}

		const solution = data.solution || {};
		const cookies = solution.cookies || [];
		const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
		const userAgent = solution.userAgent || config.useragent;

		// 带着获取的通行证 Cookie 和匹配的 User-Agent 走直连请求，返回原生 Response
		const retryHeaders = {
			...options.headers,
			'User-Agent': userAgent,
		};
		if (cookieHeader) {
			retryHeaders['Cookie'] = cookieHeader;
		}

		const res = await readURL(url, {
			...options,
			headers: retryHeaders,
		});
		res.uri = res.url;
		return res;
	} finally {
		clearTimeout(timeout);
	}
}

// 4. 统一调度入口
async function requestURL(url, options = {}) {
	const isProxy = config.proxy.url && config.proxy.secret;
	const hasSolver = Boolean(config.flaresolverr && config.flaresolverr.url);
	let retries = 2;

	for (;;) {
		try {
			let res;
			if (isProxy && retries < 2) {
				logger.info(`Request proxy for URL ${url}.`);
				res = await readProxyURL(url);
				res.uri = res.headers.get('x-request-url') || url;
			} else {
				// `options` (e.g. an Authorization header) applies to the direct
				// request; the proxy fallback can't carry per-request headers.
				res = await readURL(url, options);
				res.uri = res.url;
				if (isProxy && !res.ok && res.status !== 404) {
					throw new Error(`Bad status code: ${res.status}`);
				}
			}

			// 如果遇到盾拦截，并且配置了解盾服务，回退调用独立的 readSolverURL 通道
			if (hasSolver && isBlockedByShield(res)) {
				if (isProxy && retries === 2) {
					throw new Error(`Challenged status code: ${res.status}`);
				}
				logger.warn(`Challenge detected (${res.status}) for URL ${url}. Falling back to solver.`);
				try {
					return await readSolverURL(url, options);
				} catch (solverErr) {
					logger.error(`Solver request failed for URL ${url}: ${solverErr.message}`);
				}
			}

			return res;
		} catch (err) {
			if (isProxy && retries === 2) {
				logger.warn(`Request failed for URL ${url}, ${err.message}. Retrying via proxy`);
				--retries;
			} else {
				retries = 0;
			}
			if (!retries) {
				if (hasSolver) {
					logger.warn(`Request failed for URL ${url} (${err.message}). Attempting solver fallback.`);
					try {
						return await readSolverURL(url, options);
					} catch (solverErr) {
						logger.error(`Solver fallback also failed for URL ${url}: ${solverErr.message}`);
					}
				}
				throw err;
			}
		}
	}
}

export { readURL, readProxyURL, readSolverURL, requestURL };
export default requestURL;
