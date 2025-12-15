import fetch from '../utils/fetch';

export const search = (query, type) => {
	const params = { q: query };
	if (type) {
		params.type = type;
	}
	return fetch('GET', '/search', null, params);
};
