import moment from 'moment';
import { desc } from 'drizzle-orm';

import { config } from '../config';
import { db, checkDatabaseHealth } from '../db';
import { articles } from '../db/schema';
import { logger } from '../utils/logger';
import { Throw } from '../utils/errors';

const version = config.version;
const tooOld = 3 * 60 * 60 * 1000;

exports.health = async (req, res) => {
	res.json({ version });
};

exports.status = async (req, res) => {
	const output = { code: 200, version };
	const now = new Date();

	// Check database health
	const dbHealth = await checkDatabaseHealth();
	output.database = dbHealth;

	// Check latest article (only if database is healthy)
	if (dbHealth.status === 'healthy') {
		try {
			const latestArticle = await db.query.articles.findFirst({
				orderBy: desc(articles.createdAt),
			});

			if (latestArticle) {
				output.mostRecentArticle = moment(latestArticle.createdAt).fromNow();
				if (now - latestArticle.createdAt > tooOld) {
					output.code = 500;
					output.error = 'The most recent article is too old.';
				}
			} else {
				output.mostRecentArticle = -1;
			}
		} catch (err) {
			output.code = 500;
			output.error = 'Failed to query latest article: ' + err.message;
		}
	} else {
		output.code = 500;
		output.error = 'Database is unhealthy';
	}

	output.now = now;
	res.status(output.code).json(output);
};

exports.sentryThrow = async (req, res) => {
	Throw();
};

exports.sentryLog = async (req, res) => {
	try {
		Throw();
	} catch (err) {
		logger.error('Test error contain tags and extra', {
			err,
			tags: { env: 'testing' },
			extra: { additional: 'data', is: 'awesome' },
		});
	}
	try {
		Throw();
	} catch (err) {
		logger.error(err);
	}

	logger.error('Test error is a message');

	res.json({ version });
};
