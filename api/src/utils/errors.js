import * as Sentry from '@sentry/node';

import { config } from '../config';
import { logger } from './logger';

Sentry.init({
	dsn: config.sentry.dsn,
	environment: config.env,
	serverName: config.name,
	release: `${config.name}@${config.version}`,
});

export const setupExpressRequestHandler = (app) => {
	app.use(Sentry.Handlers.requestHandler());
};

export const setupExpressErrorHandler = (app) => {
	app.use(Sentry.Handlers.errorHandler());
	app.use(function (err, req, res, next) {
		var status =
			err.status ||
			err.statusCode ||
			err.status_code ||
			(err.output && err.output.statusCode) ||
			500;
		logger.error(err);
		return res.status(status).json('Something went wrong, please try again later');
	});
};

export const Throw = () => {
	throw new Error('This is a sentry error!');
};
