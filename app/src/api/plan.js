import fetch from '../utils/fetch';

export const getPlans = (params) => {
	return fetch('GET', '/plans', null, params);
};

export const getPlan = (planId) => {
	return fetch('GET', `/plans/${planId}`);
};

export const addPlan = (data) => {
	return fetch('POST', '/plans', data);
};

export const updatePlan = (planId, data) => {
	return fetch('PUT', `/plans/${planId}`, data);
};

export const deletePlan = (planId) => {
	return fetch('DELETE', `/plans/${planId}`);
};
