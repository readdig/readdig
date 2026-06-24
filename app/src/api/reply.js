import fetch from '../utils/fetch';

export const getRepliesByArticleId = async (dispatch, articleId, cancelToken) => {
	try {
		const res = await fetch(
			'GET',
			`/replies/${articleId}`,
			null,
			null,
			null,
			cancelToken,
		);
		dispatch({
			articleId: articleId,
			replies: res.data || [],
			type: 'UPDATE_ARTICLE_REPLIES',
		});
	} catch (err) {
		dispatch({
			articleId: articleId,
			replies: [],
			type: 'UPDATE_ARTICLE_REPLIES',
		});
	}
};
