import fetch from '../utils/fetch';

export const getPlans = () => {
	return fetch('GET', '/subscriptions/plans');
};

export const cancelSubscription = (subscriptionId) => {
	return fetch('POST', '/subscriptions/cancel', { subscriptionId });
};

export const txnSubscription = (checkoutId) => {
	return fetch('POST', `/subscriptions/transaction`, { checkoutId });
};

export const updateSubscription = (planId) => {
	return fetch('POST', `/subscriptions/${planId}`);
};

export const getSubscription = (subscriptionId) => {
	return fetch('GET', `/subscriptions/${subscriptionId}`);
};
