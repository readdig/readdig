import fetch from '../utils/fetch';
import isDispatch from '../utils/isDispatch';

export const getFeatured = async (dispatch, params, cancelToken) => {
	if (!isDispatch(dispatch)) {
		params = dispatch;
	}
	const res = await fetch('GET', '/featured', null, params, null, cancelToken);
	if (isDispatch(dispatch)) {
		dispatch({
			feeds: res.data,
			type: 'BATCH_UPDATE_FEEDS',
		});
	} else {
		return res;
	}
};

export const getFeeds = (params) => {
	return fetch('GET', '/feeds', null, params);
};

export const getFeed = (feedId) => {
	return fetch('GET', `/feeds/${feedId}`);
};

export const addFeed = (feedUrl) => {
	return fetch('POST', '/feeds', { feedUrl });
};

export const updateFeed = (feedId, data) => {
	return fetch('PUT', `/feeds/${feedId}`, data);
};

export const deleteFeed = (feedId) => {
	return fetch('DELETE', `/feeds/${feedId}`);
};

export const mergeFeed = (lFeedId, rFeedId) => {
	return fetch('PUT', '/feeds/merge', { lFeedId, rFeedId });
};

export const exportOPML = () => {
	return fetch('GET', '/feeds/opml');
};

export const likeFeed = (feedId) => {
	return fetch('POST', `/like/feed/${feedId}`);
};

export const unlikeFeed = (feedId) => {
	return fetch('DELETE', `/like/feed/${feedId}`);
};
