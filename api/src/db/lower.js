import { sql } from 'drizzle-orm';

function lower(field) {
	return sql`lower(${field})`;
}

export { lower };
