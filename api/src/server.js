import fs from 'fs';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import express from 'express';
import jwt from 'express-jwt';
import limit from 'express-rate-limit';
import boolParser from 'express-query-boolean';
import { eq } from 'drizzle-orm';

import { db } from './db';
import { users } from './db/schema';

import { config } from './config';
import { logger } from './utils/logger';
import { subscriptionMiddleware } from './utils/middlewares';
import { setupExpressRequestHandler, setupExpressErrorHandler } from './utils/errors';

const api = express();

setupExpressRequestHandler(api);

api.set('json spaces', 4);
api.enable('trust proxy');

api.use(cors({ maxAge: 1728000 }));
api.use(compression());
api.use(express.json({ limit: '5mb' }));
api.use(express.urlencoded({ extended: true }));
api.use(boolParser());

api.use(
	new limit({
		windowMs: 60 * 1000,
		max: 1000,
		delayMs: 0,
	}),
);

api.use(
	jwt({ secret: config.jwt.secret, algorithms: ['HS256'] }).unless({
		path: [
			'/',
			'/health',
			'/status',
			'/webhooks',
			'/sentry/log',
			'/sentry/throw',
			/\/queues(.*)/,
			/\/shares\/(.*)/,
			/\/images\/(.*)/,
			'/auth/signup',
			'/auth/login',
			'/auth/forgot-password',
			'/auth/reset-password',
			{ url: '/plans', methods: ['GET'] },
		],
	}),
);

api.use(async function addUser(req, res, next) {
	if (req.user) {
		try {
			const user = await db.query.users.findFirst({
				where: eq(users.id, req.user.sub),
				columns: {
					password: false,
					recoveryCode: false,
				},
			});
			if (!user) {
				return res.sendStatus(401);
			}
			if (user.suspended) {
				return res.status(401).json('This account has been suspended.');
			}
			req.User = user;
		} catch (err) {
			next(err);
		}
	}

	next();
});

api.use(
	subscriptionMiddleware().unless({
		path: [
			'/',
			'/health',
			'/status',
			'/webhooks',
			/\/plans(.*)\//,
			/\/queues(.*)/,
			/\/shares\/(.*)/,
			/\/images\/(.*)/,
			/\/subscriptions\/(.*)/,
			/\/payments\/(.*)/,
			'/sentry/log',
			'/sentry/throw',
			'/auth/signup',
			'/auth/login',
			'/auth/forgot-password',
			'/auth/reset-password',
			'/opml/download',
			{ url: /\/users\/(.*)/, methods: ['GET', 'DELETE'] },
		],
	}),
);

api.use(function catchAuthErrors(err, req, res, next) {
	if (err.name === 'UnauthorizedError') {
		res.status(401).json('Missing authentication credentials.');
	}
});

fs.readdirSync(path.join(__dirname, 'routes')).map((file) => {
	require('./routes/' + file)(api);
});

setupExpressErrorHandler(api);

if (require.main === module) {
	api.listen(config.server.port, config.server.host, (err) => {
		if (err) {
			logger.error(err);
			process.exit(1);
		}
		logger.info(
			`API is now running on http://${config.server.host}:${config.server.port} in ${config.env} mode`,
		);
	});
}

module.exports = api;
