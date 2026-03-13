import Redis from 'ioredis';

import { config } from '../config';

const redis = new Redis(config.cache.url);
redis.on('error', (err) => {
	console.error('Redis cache error', err);
});

const defaultTtl = 60;

export const cache = {
	async get(key) {
		if (!key) return null;
		const value = await redis.get(key);
		if (!value) return null;
		try {
			return JSON.parse(value);
		} catch (err) {
			console.error('Failed to parse cache entry', key, err);
			return null;
		}
	},
	async set(key, payload, ttl = defaultTtl) {
		if (!key) return;
		const value = typeof payload === 'string' ? payload : JSON.stringify(payload);
		if (ttl > 0) {
			await redis.set(key, value, 'EX', ttl);
		} else {
			await redis.set(key, value);
		}
	},
	async del(key) {
		if (!key) return;
		await redis.del(key);
	},
};
