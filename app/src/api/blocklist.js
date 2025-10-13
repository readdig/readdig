import fetch from '../utils/fetch';

export const getBlocklist = () => {
	return fetch('GET', '/blocklist');
};

export const updateBlocklist = (data) => {
	return fetch('PUT', '/blocklist', data);
};
