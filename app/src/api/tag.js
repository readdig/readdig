import fetch from '../utils/fetch';

export const getTags = (params) => {
	return fetch('GET', '/tags', null, params);
};

export const addTag = (name) => {
	return fetch('POST', '/tags', { name });
};

export const renameTag = (tagId, name) => {
	return fetch('PUT', `/tags/${tagId}`, { name });
};

export const deleteTag = async (dispatch, tagId, articleId) => {
	const res = await fetch('DELETE', `/tags/${tagId}`, { articleId });
	if (articleId) {
		dispatch({
			articleId,
			star: res.data,
			type: 'UPDATE_ARTICLE_STARS',
		});
	}
};
