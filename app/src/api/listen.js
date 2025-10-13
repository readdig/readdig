import fetch from '../utils/fetch';

export const playListen = (data) => {
	return fetch('POST', '/listens', data);
};
