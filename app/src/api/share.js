import fetch from '../utils/fetch';

export const getArticleById = async (shareId) => {
	return fetch('GET', `/shares/${shareId}`);
};
