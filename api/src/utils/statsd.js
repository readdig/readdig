import StatsD from 'hot-shots';

import { config } from '../config';
import { logger } from './logger';

let statsDClient = null;

function getStatsDClient() {
	if (!statsDClient) {
		statsDClient = new StatsD({
			globalTags: { env: config.env },
			host: config.statsd.host,
			port: config.statsd.port,
			errorHandler: function (err) {
				logger.error(`Socket errors caught here: ${err.message}`);
			},
		});
	}
	return statsDClient;
}

async function timeIt(name, fn) {
	const t0 = new Date();
	const r = await fn();
	const statsd = getStatsDClient();
	statsd.timing(name, new Date() - t0);
	return r;
}

exports.getStatsDClient = getStatsDClient;
exports.timeIt = timeIt;
