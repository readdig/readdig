import { eq, or, and } from 'drizzle-orm';
import basicAuth from 'express-basic-auth';

import { db } from '../db';
import { lower } from '../db/lower';
import { users } from '../db/schema';
import { verifyPassword } from './auth';

const asyncAuthorizer = async (email, password, cb) => {
	if (!email || !password) return cb(null, false);

	const user = await db.query.users.findFirst({
		where: and(
			or(
				eq(lower(users.email), email.trim().toLowerCase()),
				eq(users.username, email.trim()),
			),
			eq(users.admin, true),
		),
	});
	if (!user) return cb(null, false);

	if (!(await verifyPassword(password, user.password))) return cb(null, false);
	return cb(null, true);
};

export default basicAuth({
	authorizer: asyncAuthorizer,
	authorizeAsync: true,
	challenge: true,
});
