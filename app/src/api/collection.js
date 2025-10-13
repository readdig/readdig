import fetch from '../utils/fetch';

export const getCollections = async (dispatch, params) => {
	const res = await fetch('GET', '/collections', null, params);
	dispatch({
		collections: res.data,
		type: 'BATCH_COLLECTIONS',
	});
};
