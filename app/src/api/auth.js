import fetch from '../utils/fetch';

export const login = async (dispatch, email, password) => {
	const res = await fetch('post', '/auth/login', { email, password });
	dispatch({
		type: 'UPDATE_USER',
		user: res.data,
	});
	localStorage.setItem('authedUser', JSON.stringify(res.data));
};

export const signup = async (dispatch, username, email, password, language) => {
	const res = await fetch('post', '/auth/signup', {
		username,
		email,
		password,
		language,
	});
	dispatch({
		type: 'UPDATE_USER',
		user: res.data,
	});
	localStorage.setItem('authedUser', JSON.stringify(res.data));
};

export const forgotPassword = (email) => {
	return fetch('post', '/auth/forgot-password', { email });
};

export const resetPassword = (email, recoveryCode, password) => {
	return fetch('post', '/auth/reset-password', { email, recoveryCode, password });
};
