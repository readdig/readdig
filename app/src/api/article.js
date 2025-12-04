import fetch from '../utils/fetch';

export const getArticles = async (dispatch, params, cancelToken) => {
	const res = await fetch('GET', '/articles', null, params, null, cancelToken);
	dispatch({
		articles: res.data,
		type: 'BATCH_UPDATE_ARTICLES',
	});
};

export const getArticleById = async (dispatch, articleId, params, cancelToken) => {
	const res = await fetch(
		'GET',
		`/articles/${articleId}`,
		null,
		params,
		null,
		cancelToken,
	);
	dispatch({
		article: res.data,
		type: 'UPDATE_ARTICLE_CONTENT',
	});
};

export const removeArticle = async (dispatch, type, articleId) => {
	await fetch('DELETE', `/articles/${articleId}`, null, { type });
	dispatch({
		articleId,
		removeType: type,
		type: 'DELETE_ARTICLE',
	});
};

export const clearArticles = (dispatch) => {
	return dispatch({ type: 'CLEAR_ARTICLES' });
};

export const likeArticle = async (articleId) => {
	return await fetch('POST', `/like/article/${articleId}`);
};

export const unlikeArticle = async (articleId) => {
	return await fetch('DELETE', `/like/article/${articleId}`);
};
