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

export const markArticlesRead = async (dispatch, articles) => {
	const list = Array.isArray(articles) ? articles : [articles];
	const unread = list.filter((a) => a.unread);
	if (unread.length === 0) return;

	for (const article of unread) {
		dispatch({
			articleId: article.id,
			feedId: article.feed && article.feed.id,
			type: 'MARK_ARTICLE_READ',
		});
	}

	try {
		if (unread.length === 1) {
			await fetch('POST', '/articles/read', { articleId: unread[0].id });
		} else {
			await fetch('POST', '/articles/read', {
				articleIds: unread.map((a) => a.id),
			});
		}
	} catch (err) {
		for (const article of unread) {
			dispatch({
				articleId: article.id,
				feedId: article.feed && article.feed.id,
				type: 'MARK_ARTICLE_UNREAD',
			});
		}
		throw err;
	}
};
