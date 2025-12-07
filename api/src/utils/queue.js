import Queue from 'bull';
import Redis from 'ioredis';

import { config } from '../config';
import { logger } from './logger';

const redis = new Redis(config.cache.url);

function queueTracking(queueName) {
	const queue = new Queue(queueName, config.cache.url, {
		prefix: 'queue',
		settings: {
			lockDuration: 90000,
			stalledInterval: 75000,
			maxStalledCount: 2,
		},
		defaultJobOptions: {
			removeOnComplete: true,
			removeOnFail: true,
		},
	});

	queue.on('stalled', function (job) {
		logger.warn(`Queue ${queue.name} job stalled: '${JSON.stringify(job)}'`);
	});

	queue.on('error', function (err) {
		logger.warn(`Queue ${queue.name} error: ${err.message}`);
	});

	queue.client.on('reconnecting', function () {
		logger.info(`Queue ${queue.name} reconnecting to Redis...`);
	});

	queue.client.on('ready', function () {
		logger.info(`Queue ${queue.name} connected to Redis`);
	});

	queue.on('failed', function (job, err) {
		logger.warn(
			`Queue ${queue.name} failed to process job '${JSON.stringify(job)}': ${
				err.message
			}`,
		);
	});

	return queue;
}

export const queues = {
	feed: queueTracking('feed'),
	og: queueTracking('og'),
};

export function addQueue(queueName, ...arg) {
	const queue = queues[queueName];
	return queue.add(...arg);
}

export function addBulkQueue(queueName, jobs) {
	const queue = queues[queueName];
	return queue.addBulk(jobs);
}

export function processQueue(queueName, ...arg) {
	const queue = queues[queueName];
	return queue.process(...arg);
}

export function shutdownQueue(queueName, doNotWaitJobs) {
	const queue = queues[queueName];
	return queue.close(doNotWaitJobs);
}

export async function addQueueStatus(queueName, value) {
	const key = `queue-status:${queueName}`;
	const time = await redis.time();
	const score = parseInt(time[0]);

	let data = [];
	if (Array.isArray(value)) {
		for (let i = value.length - 1; i >= 0; i--) {
			data.push(score);
			data.push(value[i]);
		}
	} else {
		data = [score, value];
		const exists = await redis.zrank(key, value);
		if (exists !== null) {
			return true;
		}
	}
	return await redis.zadd(key, data);
}

export async function getQueueStatus(queueName) {
	const key = `queue-status:${queueName}`;
	return await redis.zrange(key, 0, -1);
}

export async function removeQueueStatus(queueName, value) {
	const key = `queue-status:${queueName}`;
	return await redis.zrem(key, value);
}

export async function clearQueueStatus(queueName) {
	const key = `queue-status:${queueName}`;
	return await redis.del(key);
}
