import computeHash from './hash';

export const filterArticle = (article) => {
	if (!article || (article && !article.feed)) {
		return article;
	}

	return article;
};

export const filterArticles = (articles) => {
	if (!articles || articles.length === 0) {
		return articles;
	}

	// add contentHash
	for (let i = articles.length - 1; i >= 0; i--) {
		let article = articles[i];
		let hashTitle = article.title.trim();
		let hashDescription = article.description.substring(0, 100).trim();

		if (
			article.feed &&
			article.feed.feedUrl &&
			article.feed.feedUrl.includes('v2ex.com/index.xml')
		) {
			hashTitle = article.title.replace(/^\[.*?\]+/, '').trim();
		}

		const contentHash = computeHash(`${hashTitle}:${hashDescription}`);
		article.contentHash = contentHash;
	}

	return articles;
};
