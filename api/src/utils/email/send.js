import fs from 'fs';
import ejs from 'ejs';
import sendgrid from '@sendgrid/mail';

import { config } from '../../config';
import { logger } from '../logger';
import locales from './locales';

const DummyEmailTransport = { emails: [] };

export const SendWelcomeEmail = async (data, lang = 'en') => {
	const lng = locales[lang] ? lang : 'en';
	const msg = ejs.render(
		fs.readFileSync(__dirname + `/templates/welcome.${lng}.ejs`, 'utf8'),
		{
			name: data.name,
			username: data.username,
		},
	);

	const obj = {
		to: {
			email: data.email,
			name: data.name,
		},
		from: {
			email: config.email.sender.support.email,
			name: config.email.sender.support.name,
		},
		subject: `${locales[lng]['Welcome to']} ${config.product.name}!`,
		html: msg,
	};

	return await SendEmail(obj);
};

export const SendPasswordResetEmail = async (data, lang = 'en') => {
	const lng = locales[lang] ? lang : 'en';
	const msg = ejs.render(
		fs.readFileSync(__dirname + `/templates/password.${lng}.ejs`, 'utf8'),
		{
			name: data.name,
			username: data.username,
			recoveryCode: data.recoveryCode,
		},
	);

	const obj = {
		to: {
			email: data.email,
			name: data.name,
		},
		from: {
			email: config.email.sender.support.email,
			name: config.email.sender.support.name,
		},
		subject: `${locales[lng]['Forgot password']} | ${config.product.name}!`,
		html: msg,
	};
	return await SendEmail(obj);
};

export const SendEmail = async (obj) => {
	if (config.email.backend === 'sendgrid') {
		if (!config.email.sendgrid.secret) {
			throw new Error('Could not send reset email, missing Sendgrid secret.');
		}
		sendgrid.setApiKey(config.email.sendgrid.secret);

		try {
			let res = await sendgrid.send(obj);
			return res;
		} catch (err) {
			logger.error(err);
			return null;
		}
	} else {
		DummyEmailTransport.emails.unshift(obj);
		return obj;
	}
};
