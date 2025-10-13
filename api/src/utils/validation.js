import validator from 'validator';
import { normalizeUrl } from './urls';

export function isURL(url) {
	if (!url) {
		return false;
	}
	if (typeof url != 'string') {
		return false;
	}
	if (url.indexOf('newsletter:') == 0) {
		return false;
	}
	// make sure that mysubdomain-.google.com works and myurl.com/?q=hello world also works
	let variations = [
		url,
		url.replace(' ', '+'),
		url.replace('-.', '-a.'),
		normalizeUrl(url),
	];
	let valid = variations.some((v) => {
		let ok = validator.isURL(v, {
			protocols: ['http', 'https'],
			allow_underscores: true,
			allow_trailing_dot: true,
		});
		return ok;
	});
	return valid;
}

export function isEmail(email) {
	return validator.isEmail(email);
}

export function isUsername(username) {
	const regex = /^(?=.{3,20}$)(?![-_.])(?!.*[-_.]{2})[a-zA-Z0-9._-]+(?<![-_.])$/;
	if (username && !regex.test(username)) {
		return false;
	}
	return true;
}

export function isDataURL(data) {
	return validator.isDataURI(data);
}

export function isUUID(uuid) {
	return validator.isUUID(uuid);
}
