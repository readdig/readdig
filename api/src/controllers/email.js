import { eq, and } from 'drizzle-orm';

import { config } from '../config';
import { db } from '../db';
import { users } from '../db/schema';
import { SendEmail } from '../utils/email/send';

const sendContent = 'This is a test email.';

exports.get = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const userId = req.params.userId;

	const user = await db.query.users.findFirst({
		where: and(eq(users.id, userId), eq(users.role, 'admin')),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	res.type('html').send(sendContent);
};

exports.post = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const userId = req.params.userId;

	const user = await db.query.users.findFirst({
		where: and(eq(users.id, userId), eq(users.role, 'admin')),
	});

	if (!user) {
		return res.status(404).json('User does not exist.');
	}

	const obj = {
		to: {
			email: user.email,
			name: user.name,
		},
		from: {
			email: config.email.sender.support.email,
			name: config.email.sender.support.name,
		},
		subject: 'Welcome to Readdig!',
		html: sendContent,
	};

	const result = await SendEmail(obj);

	res.json(result);
};
