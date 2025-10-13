import fetch from '../utils/fetch';

export const clearUnread = async (dispatch, data) => {
	const res = await fetch('POST', '/unread/clear', data);
	dispatch({
		...data,
		type: 'CLEAR_UNREAD_ARTICLES',
	});
	return res;
};
