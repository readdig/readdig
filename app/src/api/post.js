import fetch from '../utils/fetch';

export const getPosts = (query) => {
	return fetch('GET', '/posts', null, query);
};
