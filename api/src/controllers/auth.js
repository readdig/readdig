import { v4 as uuidv4 } from 'uuid';
import { eq, or, and } from 'drizzle-orm';

import { db } from '../db';
import { lower } from '../db/lower';
import { users } from '../db/schema';
import { isBlockedUsername } from '../utils/blocklist';
import { isEmail, isUsername } from '../utils/validation';
import { SendPasswordResetEmail, SendWelcomeEmail } from '../utils/email/send';
import {
	cryptoPassword,
	verifyPassword,
	serializeAuthenticatedUser,
} from '../utils/auth';

exports.signup = async (req, res) => {
	const body = req.body || {};
	const language = body.language || 'en';
	const data = {
		email: body.email,
		name: body.username,
		username: body.username,
		password: body.password,
		settings: {
			language,
			unreadOnly: false,
			mobileHideSidebar: true,
			fontSize: 0,
			textSize: 0,
		},
	};

	if (!data.email || !data.username || !data.password) {
		return res.status(400).json('Missing required fields.');
	}

	if (data.email && !isEmail(data.email)) {
		return res.status(400).json('Invalid email address.');
	}

	if (data.username && isBlockedUsername(data.username)) {
		return res.status(400).json('Username is blocked.');
	}

	if (data.username && !isUsername(data.username)) {
		return res
			.status(400)
			.json('Username must be alphanumeric but can only contain _, . or -.');
	}

	data.name = data.username.trim();
	data.username = data.username.trim();
	data.email = data.email.trim().toLowerCase();
	data.password = await cryptoPassword(data.password);

	const exists = await db.query.users.findFirst({
		where: or(
			eq(lower(users.email), data.email.toLowerCase()),
			eq(users.username, data.email),
		),
	});

	if (exists) {
		return res.status(400).json('A user already exists with that username or email.');
	}

	const userCount = await db.$count(users);
	const isFirstUser = userCount === 0;
	data.role = isFirstUser ? 'admin' : 'user';

	const [user] = await db.insert(users).values(data).returning();

	await SendWelcomeEmail(
		{
			email: user.email,
			name: user.name,
			username: user.name,
		},
		language,
	);

	const serialized = await serializeAuthenticatedUser(user);
	res.json(serialized);
};

exports.login = async (req, res) => {
	const data = req.body || {};

	if (!data.email || !data.password) {
		return res.status(400).json('Missing required fields.');
	}

	const email = data.email.trim();
	const user = await db.query.users.findFirst({
		where: or(eq(lower(users.email), email.toLowerCase()), eq(users.username, email)),
	});

	if (!user) {
		return res.status(404).json('Username or Email does not exist.');
	}

	if (!(await verifyPassword(data.password, user.password))) {
		return res.status(400).json('Password incorrect.');
	}

	if (user.suspended) {
		return res.status(400).json('This account has suspended.');
	}

	const serialized = await serializeAuthenticatedUser(user);
	res.json(serialized);
};

exports.forgotPassword = async (req, res) => {
	const recoveryCode = uuidv4();

	const email = req.body.email.trim().toLowerCase();

	const [user] = await db
		.update(users)
		.set({ recoveryCode })
		.where(eq(lower(users.email), email))
		.returning();

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const language = user.settings.language || 'en';

	await SendPasswordResetEmail(
		{
			email: user.email,
			name: user.name,
			username: user.username,
			recoveryCode: user.recoveryCode,
		},
		language,
	);

	res.sendStatus(204);
};

exports.resetPassword = async (req, res) => {
	const data = req.body || {};

	const password = await cryptoPassword(data.password);
	const [user] = await db
		.update(users)
		.set({
			password,
			recoveryCode: '',
		})
		.where(
			and(
				eq(lower(users.email), data.email.trim().toLowerCase()),
				eq(users.recoveryCode, data.recoveryCode),
			),
		)
		.returning();

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const serialized = await serializeAuthenticatedUser(user);
	res.json(serialized);
};
