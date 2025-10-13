import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const ParseContent = async (url) => {
	const doc = await JSDOM.fromURL(url);
	let reader = new Readability(doc.window.document);
	let article = reader.parse();

	return article;
};
