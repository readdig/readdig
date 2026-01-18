import fetch from '../utils/fetch';

export const getFeaturedFeeds = async (params, cancelToken) => {
	const res = await fetch('GET', '/featured', null, params, null, cancelToken);
	return res;
};

export const getFeaturedArticles = async (params, cancelToken) => {
	const res = await fetch('GET', '/featured/articles', null, params, null, cancelToken);
	return res;
};
