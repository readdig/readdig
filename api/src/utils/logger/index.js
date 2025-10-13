import { inspect } from 'util';
import winston from 'winston';
import SentryTransport from 'winston-transport-sentry-node';

import { config } from '../../config';

const options = {
	level: config.logger.level,
	sentry: {
		dsn: config.sentry.dsn,
		environment: config.env,
		serverName: config.name,
		release: `${config.name}@${config.version}`,
	},
};

const isError = (e) => {
	return e && e.stack && e.message;
};

const sillyWinstonConsoleFormatter = winston.format.printf((info) => {
	let msg = info.message;
	if (isError(info)) {
		msg = info.stack;
	} else if (isError(info.message)) {
		msg = info.message.stack;
	} else if (isError(info.err)) {
		msg = `${info.message}, ${info.err.stack}`;
	} else if (info.message && isError(info.message.err)) {
		msg = `${info.message}, ${info.message.err.stack}`;
	}
	const meta = info.meta !== undefined ? inspect(info.meta, { depth: null }) : '';
	return `[${info.timestamp}] [${info.level}] ${msg} ${meta}`;
});

export const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
		sillyWinstonConsoleFormatter,
	),
	transports: [new winston.transports.Console(), new SentryTransport(options)],
});
