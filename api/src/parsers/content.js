import { JSDOM } from 'jsdom';
import { Readability, isProbablyReaderable } from '@mozilla/readability';

import request from '../utils/request';

export const ParseContent = async (url) => {
	const response = await request(url);
	const html = await response.text();
	const doc = new JSDOM(html, { url });

	if (!isProbablyReaderable(doc.window.document)) {
		return null;
	}

	let reader = new Readability(doc.window.document);
	let article = reader.parse();

	return article;
};
