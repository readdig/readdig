import fetch from '../utils/fetch';

export const getFollowFeeds = (params) => {
	return fetch('GET', '/follows', null, params);
};

export const followFeed = async (dispatch, feedId, folderId) => {
	const res = await fetch('POST', '/follows', { feedId, folderId });
	dispatch({
		follow: res.data,
		type: 'UPDATE_FOLLOW_FEED',
	});
};

export const unfollowFeed = async (dispatch, feedIds) => {
	await fetch('DELETE', '/follows', { feedIds });
	dispatch({
		feedIds,
		type: `UPDATE_UNFOLLOW_FEED`,
	});
};

export const primaryFeed = async (dispatch, feedId, primary) => {
	const res = await fetch('PUT', '/follows', { feedId, primary });
	dispatch({
		follow: res.data,
		type: 'UPDATE_FOLLOW_FEED',
	});
};

export const renameFeed = async (dispatch, feedId, alias) => {
	const res = await fetch('PUT', '/follows', { feedId, alias });
	dispatch({
		follow: res.data,
		type: `UPDATE_FOLLOW_FEED`,
	});
};

export const fullTextFeed = async (dispatch, feedId, fullText) => {
	const res = await fetch('PUT', '/follows', { feedId, fullText });
	dispatch({
		follow: res.data,
		type: `UPDATE_FOLLOW_FEED`,
	});
};

export const followFolder = async (dispatch, feedIds, folderId) => {
	const res = await fetch('PUT', `/follows/folder`, { feedIds, folderId });
	dispatch({
		feedIds,
		folderId,
		type: `UPDATE_FOLLOW_FOLDER`,
	});
	return res;
};
