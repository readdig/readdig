import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as schema from './schema';
import { config } from '../config';

const client = postgres(config.database.url);

const db = drizzle(client, { schema });

const checkDatabaseHealth = async () => {
	try {
		const startTime = Date.now();
		await client`SELECT 1`;
		const responseTime = Date.now() - startTime;

		return {
			status: 'healthy',
			responseTime: `${responseTime}ms`,
		};
	} catch (err) {
		return {
			status: 'unhealthy',
			error: err.message,
			code: err.code,
			timestamp: new Date().toISOString(),
		};
	}
};

export { db, client, checkDatabaseHealth };
