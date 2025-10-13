import fetch from '../utils/fetch';

export const getEmail = (userId) => {
	return fetch('get', `/email/${userId}`);
};

export const sendEmail = (userId) => {
	return fetch('post', `/email/${userId}`);
};
