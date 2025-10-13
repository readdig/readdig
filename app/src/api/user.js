import fetch from '../utils/fetch';
import isDispatch from '../utils/isDispatch';

export const getUsers = (query) => {
	return fetch('GET', '/users', null, query);
};

export const getUser = async (dispatch, userId) => {
	const res = await fetch('GET', `/users/${userId}`);
	dispatch({
		type: 'UPDATE_USER',
		user: res.data,
	});
	localStorage.setItem('authedUser', JSON.stringify(res.data));
};

export const updateUser = async (dispatch, userId, data) => {
	let p1 = userId,
		p2 = data;
	if (!isDispatch(dispatch)) {
		p1 = dispatch;
		p2 = userId;
	}
	const res = await fetch('PUT', `/users/${p1}`, p2);
	if (isDispatch(dispatch)) {
		dispatch({
			type: 'UPDATE_USER',
			user: res.data,
		});
		localStorage.setItem('authedUser', JSON.stringify(res.data));
	} else {
		return res;
	}
};

export const deleteUser = (userId, password) => {
	return fetch('DELETE', `/users/${userId}`, { password });
};

export const deleteHistory = (userId, services, password) => {
	return fetch('DELETE', `/users/history/${userId}`, { services, password });
};
