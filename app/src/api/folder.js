import fetch from '../utils/fetch';

export const getFolders = (params) => {
	return fetch('GET', '/folders', null, params);
};

export const newFolder = async (dispatch, data) => {
	const res = await fetch('POST', '/folders', data);
	dispatch({
		folder: res.data,
		type: 'NEW_FOLDER',
	});
	return res;
};

export const updateFolder = async (dispatch, folderId, data) => {
	const res = await fetch('PUT', `/folders/${folderId}`, data);
	dispatch({
		folder: res.data,
		type: 'UPDATE_FOLDER',
	});
};

export const deleteFolder = async (dispatch, unfollow, folderIds, feedIds) => {
	await fetch('DELETE', `/folders`, { unfollow, folderIds, feedIds });
	dispatch({
		unfollow,
		folderIds,
		feedIds,
		type: 'DELETE_FOLDER',
	});
};
