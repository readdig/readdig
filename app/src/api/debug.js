import fetch from '../utils/fetch';

export const debugOG = (url) => {
	return fetch('POST', '/debug/og', { url });
};

export const debugFeed = (url) => {
	return fetch('POST', '/debug/feed', { url });
};

export const debugDiscover = (url) => {
	return fetch('POST', '/debug/discover', { url });
};
