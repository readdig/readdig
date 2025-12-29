import fetch from '../utils/fetch';

export const getCategories = (params) => {
	return fetch('GET', '/categories', null, params);
};

export const getCategory = (id) => {
	return fetch('GET', `/categories/${id}`);
};

export const createCategory = (data) => {
	return fetch('POST', '/categories', data);
};

export const updateCategory = (id, data) => {
	return fetch('PUT', `/categories/${id}`, data);
};

export const deleteCategory = (id) => {
	return fetch('DELETE', `/categories/${id}`);
};

export const getCategoryFeeds = (id, params) => {
	return fetch('GET', `/categories/${id}/feeds`, null, params);
};

export const addFeedToCategory = (categoryId, feedId) => {
	return fetch('POST', `/categories/${categoryId}/feeds/${feedId}`);
};

export const removeFeedFromCategory = (categoryId, feedId) => {
	return fetch('DELETE', `/categories/${categoryId}/feeds/${feedId}`);
};

export const updateCategoryFeeds = (categoryId, feedIds) => {
	return fetch('PUT', `/categories/${categoryId}/feeds`, { feedIds });
};
