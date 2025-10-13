import axios from 'axios';
import { toast } from 'react-toastify';

import i18n from '../locales';
import config from '../config';
import { getCurrentUser } from './user';

// Add a response interceptor
axios.interceptors.response.use(
	function (response) {
		return response;
	},
	function (error) {
		const unless = [
			'get:/totals',
			'get:/users/(.*)',
			'get:/subscriptions/(.*)',
			'post:/listens',
			'post:/subscriptions/transaction',
			'post:/unread/clear',
		].find((p) => {
			const params = `${error.config.method}:${error.config.url}`;
			return error.config && (params === p || params.replace(new RegExp(p), '') === '');
		});

		if (!axios.isCancel(error) && !unless) {
			if (error.response && error.response.status === 401) {
				localStorage.clear();
				window.location = '/';
				return;
			}
			if (error.response && error.response.status === 403) {
				if (window.location.pathname !== '/settings/plans') {
					window.location = '/settings/plans';
				}
				return;
			}
			let errorMessage = i18n.t('Network error, please try again.');
			if (
				error.response &&
				error.response.status >= 400 &&
				error.response.status < 500 &&
				error.response.data
			) {
				errorMessage = error.response.data;
			} else if (
				error.response &&
				error.response.status >= 500 &&
				error.response.status < 600 &&
				error.response.statusText
			) {
				errorMessage = error.response.statusText;
			}
			toast.error(errorMessage, { toastId: 'errResponse' });
		}
		return Promise.reject(error);
	},
);

const fetch = (method, path, data, params, headers, cancelToken) => {
	if (!method) throw new Error('Method is a required field.');
	if (!path) throw new Error('Path is a required field.');

	const currentUser = getCurrentUser();
	const jwt = currentUser ? currentUser.jwt : null;
	const authorization = jwt ? { Authorization: `Bearer ${jwt}` } : {};

	const options = {
		method: method.toUpperCase(),
		baseURL: config.api.url,
		url: path,
		data: data || {},
		params: params || {},
		headers: {
			'Content-Type': 'application/json',
			...authorization,
			...headers,
		},
		cancelToken,
	};

	return axios(options);
};

export default fetch;
