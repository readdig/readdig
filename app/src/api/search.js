import fetch from '../utils/fetch';

export const search = (query, options = {}, page = 1) => {
	const params = { q: query, page };
	if (options.type) {
		params.type = options.type;
	}
	if (options.categoryId) {
		params.categoryId = options.categoryId;
	}
	return fetch('GET', '/search', null, params);
};
