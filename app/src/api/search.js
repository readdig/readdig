import fetch from '../utils/fetch';

export const search = (query) => {
	return fetch('GET', '/search', null, { q: query });
};
