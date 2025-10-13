import dotenv from 'dotenv';
import path from 'path';

import pkg from '../../package.json';

const configs = {
	development: { config: 'dev' },
	production: { config: 'prod' },
	test: {
		config: 'test',
		env: path.resolve(__dirname, '..', '..', 'test', '.env'),
	},
};

const currentEnvironment = process.env.NODE_ENV || 'development';

const defaultPath = path.resolve(__dirname, '..', '..', '.env');
const envPath = configs[currentEnvironment].env || defaultPath;

console.log(`Loading .env from '${envPath}'`);
dotenv.config({ path: envPath });

const _default = {
	name: pkg.name,
	version: pkg.version,
	product: {
		url: process.env.PRODUCT_URL,
		name: process.env.PRODUCT_NAME,
	},
	server: {
		host: process.env.API_HOST,
		port: process.env.API_PORT,
	},
	useragent: process.env.USER_AGENT,
	jwt: {
		secret: process.env.JWT_SECRET,
	},
	database: {
		url: process.env.DATABASE_URL,
	},
	cache: {
		url: process.env.CACHE_URL,
	},
	static: {
		path: process.env.STATIC_PATH,
	},
	logger: {
		level: process.env.LOGGER_LEVEL || 'error',
	},
	sentry: {
		dsn: process.env.SENTRY_DSN,
	},
	proxy: {
		url: process.env.CLOUDFLARE_PROXY_URL || '',
		secret: process.env.CLOUDFLARE_PROXY_SECRET || '',
	},
	email: {
		backend: 'sendgrid',
		sender: {
			support: {
				name: process.env.EMAIL_SENDER_SUPPORT_NAME,
				email: process.env.EMAIL_SENDER_SUPPORT_EMAIL,
			},
		},
		sendgrid: {
			secret: process.env.EMAIL_SENDGRID_SECRET,
		},
	},
	statsd: {
		host: process.env.STATSD_HOST || 'localhost',
		port: process.env.STATSD_PORT || 8125,
	},
	paddle: {
		url: process.env.PADDLE_API_URL,
		vendorId: process.env.PADDLE_VENDOR_ID,
		vendorAuthCode: process.env.PADDLE_VENDOR_AUTH_CODE,
		publicKey: process.env.PADDLE_PUBLIC_KEY,
	},
	newrelic: false,
};

const currentConfig = require(`./${configs[currentEnvironment].config}`);

export const config = Object.assign({ env: currentEnvironment }, _default, currentConfig);
