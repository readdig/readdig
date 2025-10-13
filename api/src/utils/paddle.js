import fetch from 'node-fetch';

import { config } from '../config';

export const getSubscriptionPlans = async () => {
	const params = new URLSearchParams();
	params.append('vendor_id', config.paddle.vendorId);
	params.append('vendor_auth_code', config.paddle.vendorAuthCode);

	const options = {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	};

	const response = await fetch(config.paddle.url + '/subscription/plans', options);
	const data = await response.json();

	return data;
};

export const cancelSubscription = async (subscriptionId) => {
	const params = new URLSearchParams();
	params.append('vendor_id', config.paddle.vendorId);
	params.append('vendor_auth_code', config.paddle.vendorAuthCode);
	params.append('subscription_id', subscriptionId);

	const options = {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	};

	const response = await fetch(config.paddle.url + '/subscription/users_cancel', options);
	const data = await response.json();

	return data;
};

export const getTransactions = async (checkoutId) => {
	const params = new URLSearchParams();
	params.append('vendor_id', config.paddle.vendorId);
	params.append('vendor_auth_code', config.paddle.vendorAuthCode);

	const options = {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params,
	};

	const response = await fetch(
		config.paddle.url + '/checkout/' + checkoutId + '/transactions',
		options,
	);
	const data = await response.json();

	return data;
};
