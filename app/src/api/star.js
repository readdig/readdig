import fetch from '../utils/fetch';

export const starArticle = async (dispatch, articleId) => {
	await fetch('POST', '/stars', { articleId });
	dispatch({
		articleId,
		type: 'STAR_ARTICLE',
	});
};

export const unstarArticle = async (dispatch, articleId) => {
	await fetch('DELETE', `/stars/${articleId}`);
	dispatch({
		articleId,
		type: 'UNSTAR_ARTICLE',
	});
};

export const updateStar = async (dispatch, articleId, tagId) => {
	const res = await fetch('PUT', `/stars/${articleId}`, { tagId });
	dispatch({
		articleId,
		star: res.data,
		type: 'UPDATE_ARTICLE_STARS',
	});
};
