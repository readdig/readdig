export function ParseFeedType(feedType) {
	let publicationType;
	if (!feedType) {
		return publicationType;
	}
	if (feedType.toLowerCase().trim() === 'rss') {
		publicationType = 'rss';
	}
	if (feedType.toLowerCase().trim() === 'podcast') {
		publicationType = 'podcast';
	}
	return publicationType;
}

export function ParseArticleType(feedType) {
	let articleType;
	if (!feedType) {
		return articleType;
	}
	if (feedType.toLowerCase().trim() === 'rss') {
		articleType = 'article';
	}
	if (feedType.toLowerCase().trim() === 'podcast') {
		articleType = 'episode';
	}
	return articleType;
}
