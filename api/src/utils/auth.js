import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { config } from '../config';
import gravatar from './gravatar';
import { userSubscription } from './subscription';

export const cryptoPassword = async (password) => {
	return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
	return await bcrypt.compare(plainPassword, hashedPassword);
};

export const serializeAuthenticatedUser = async (user) => {
	const subscription = await userSubscription(user.id);

	const serialized = {
		id: user.id,
		name: user.name,
		email: user.email,
		username: user.username,
		avatar: user.avatar,
		bio: user.bio,
		url: user.url,
		background: user.background,
		admin: user.admin,
		suspended: user.suspended,
		subscription: subscription,
		settings: user.settings || {},
		jwt: jwt.sign({ email: user.email, sub: user.id }, config.jwt.secret),
	};

	if (!user.avatar && user.email) {
		serialized.avatar = gravatar(user.email);
	}

	return serialized;
};
