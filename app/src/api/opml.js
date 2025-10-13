import fetch from '../utils/fetch';

export const opmlUpload = async (dispatch, formData) => {
	const res = await fetch('POST', '/opml/upload', formData, null, {
		'Content-Type': 'multipart/form-data',
	});

	dispatch({
		folders: res.data.folders,
		follows: res.data.follows,
		type: 'BATCH_OPML_FEEDS',
	});
};

export const opmlDownload = () => {
	return fetch('GET', '/opml/download');
};
