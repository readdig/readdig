import fetch from '../utils/fetch';

export const getTotals = async (dispatch) => {
	const res = await fetch('GET', '/totals');
	dispatch({
		totals: res.data,
		type: 'BATCH_UPDATE_TOTALS',
	});
};

export const getStats = () => {
	return fetch('GET', '/totals/stats');
};

export const getMonitoring = () => {
	return fetch('GET', '/totals/monitoring');
};
