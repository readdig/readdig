import fetch from '../utils/fetch';

export const getPayments = (params) => {
	return fetch('GET', '/payments', null, params);
};

export const getUserPayments = (params) => {
	return fetch('GET', '/payments/history', null, params);
};
