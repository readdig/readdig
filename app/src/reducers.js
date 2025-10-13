// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	UPDATE_USER: (previousState, action) => {
		return {
			...previousState,
			user: { ...action.user },
		};
	},
	UPDATE_MENU_OPEN: (previousState, action) => {
		return {
			...previousState,
			menuIsOpen: action.menuIsOpen,
		};
	},
	UPDATE_FOLDER_OPEN: (previousState, action) => {
		return {
			...previousState,
			folderIsOpen: action.folderIsOpen,
		};
	},
	BATCH_UPDATE_TOTALS: (previousState, action) => {
		return {
			...previousState,
			totals: { ...action.totals },
		};
	},
	BATCH_COLLECTIONS: (previousState, action) => {
		let folders = {},
			follows = {};

		for (const item of action.collections) {
			if (item.id !== '0') {
				folders[item.id] = { id: item.id, name: item.name, icon: item.icon };
			}

			for (const feed of item.follows) {
				follows[feed.id] = feed;
			}
		}

		return { ...previousState, folders, follows };
	},
	NEW_FOLDER: (previousState, action) => {
		const folders = previousState.folders;
		const folder = action.folder;

		return {
			...previousState,
			folders: {
				...folders,
				[folder.id]: {
					id: folder.id,
					name: folder.name,
					icon: folder.icon,
				},
			},
		};
	},
	UPDATE_FOLDER: (previousState, action) => {
		const folders = previousState.folders;
		const folder = action.folder;

		return {
			...previousState,
			folders: {
				...folders,
				[folder.id]: {
					id: folder.id,
					name: folder.name,
					icon: folder.icon,
				},
			},
		};
	},
	DELETE_FOLDER: (previousState, action) => {
		let folders = { ...previousState.folders };
		let follows = { ...previousState.follows };
		const feedIds = action.feedIds || [];
		const folderIds = action.folderIds || [];
		const unfollow = action.unfollow;
		const followValues = Object.values(follows || {});

		for (let i = 0; i < folderIds.length; i++) {
			const folderId = folderIds[i];
			if (folders[folderId]) {
				delete folders[folderId];
			}
		}

		const folderFeeds = followValues.filter((f) => folderIds.includes(f.folderId));

		if (unfollow) {
			let feeds = folderFeeds;
			if (feedIds && feedIds.length > 0) {
				feeds = folderFeeds.filter((f) => feedIds.includes(f.id));
			}
			for (let feed of feeds) {
				delete follows[feed.id];
			}
		}

		for (let feed of folderFeeds) {
			if (follows[feed.id]) {
				follows[feed.id].folderId = null;
				follows[feed.id].checked = false;
			}
		}

		return { ...previousState, folders, follows };
	},
	BATCH_OPML_FEEDS: (previousState, action) => {
		const follows = previousState.follows;
		const folders = previousState.folders;

		const opmlFeeds = action.follows.reduce((result, feed) => {
			result[feed.id] = feed;
			return result;
		}, {});

		const opmlFolders = action.folders.reduce((result, { id, name }) => {
			result[id] = { id, name };
			return result;
		}, {});

		return {
			...previousState,
			folders: {
				...folders,
				...opmlFolders,
			},
			follows: {
				...follows,
				...opmlFeeds,
			},
		};
	},
	UPDATE_FOLLOW_FEED: (previousState, action) => {
		const data = action.follow;
		const follows = previousState.follows;

		let original = data.duplicateOfId && follows && follows[data.duplicateOfId];

		return {
			...previousState,
			follows: {
				...follows,
				[data.id]: original || data,
			},
		};
	},
	UPDATE_UNFOLLOW_FEED: (previousState, action) => {
		const feedIds = action.feedIds;
		const follows = { ...previousState.follows };

		for (let i = 0; i < feedIds.length; i++) {
			const feedId = feedIds[i];
			if (follows[feedId]) {
				delete follows[feedId];
			}
		}

		return {
			...previousState,
			follows,
		};
	},
	UPDATE_FOLLOW_FOLDER: (previousState, action) => {
		const follows = { ...previousState.follows };
		const feedIds = action.feedIds;
		const folderId = action.folderId;

		for (let i = 0; i < feedIds.length; i++) {
			const feedId = feedIds[i];
			if (follows[feedId]) {
				follows[feedId].folderId = folderId || null;
				follows[feedId].checked = false;
			}
		}

		return {
			...previousState,
			follows,
		};
	},
	BATCH_UPDATE_ARTICLES: (previousState, action) => {
		let articles = action.articles.reduce((result, item) => {
			result[item.id] = item;
			return result;
		}, {});

		// TODO: Refactor
		for (let article in articles) {
			if (!article.duplicateOf) continue;
			const previous =
				previousState.articles && previousState.articles[article.duplicateOf];
			const next = articles[article.duplicateOf];
			articles[article.id] = next || previous || article;
		}

		// Remove duplicates
		const articlesOriginal = {
			...previousState.articles,
			...articles,
		};
		const articlesState = {},
			articlesArray = [];

		for (const articleId in articlesOriginal) {
			const article = articlesOriginal[articleId];
			if (!articlesArray.includes(article.contentHash)) {
				articlesArray.push(article.contentHash);
				articlesState[article.id] = article;
			}
		}

		return {
			...previousState,
			reachedEndOfArticles: action.articles.length === 0,
			articles: articlesState,
		};
	},
	CLEAR_ARTICLES: (previousState, action) => {
		return {
			...previousState,
			reachedEndOfArticles: false,
			articles: {},
		};
	},
	CLEAR_UNREAD_ARTICLES: (previousState, action) => {
		const user = previousState.user;
		const articles = { ...previousState.articles };
		const follows = { ...previousState.follows };
		const feedIds = action.feedIds ? [...action.feedIds] : [];
		const folderIds = action.folderIds || [];

		if (user.settings.unreadOnly) {
			const feeds = Object.values(follows).filter((follow) =>
				folderIds.includes(follow.folderId),
			);

			const uniqueFeedIds = new Set(feedIds);
			feeds.forEach((feed) => {
				uniqueFeedIds.add(feed.id);
			});

			const mergedFeedIds = [...uniqueFeedIds];

			for (const articleId of Object.keys(articles)) {
				const article = articles[articleId];
				if (mergedFeedIds.includes(article.feed.id)) {
					delete articles[articleId];
				}
			}
		}

		return {
			...previousState,
			reachedEndOfArticles:
				Object.keys(articles).length === 0 ? true : previousState.reachedEndOfArticles,
			articles,
		};
	},
	DELETE_ARTICLE: (previousState, action) => {
		const articleId = action.articleId;
		const removeType = action.removeType;
		const articles = { ...previousState.articles };
		delete articles[articleId];

		let totals = { ...previousState.totals };
		let article = previousState.article ? { ...previousState.article } : undefined;

		if (removeType === 'stars') {
			totals.star = totals.star >= 1 ? totals.star - 1 : 0;
			if (article && article.id === articleId) {
				article.stared = false;
			}
		}

		if (removeType === 'recent-read') {
			totals.recentRead = totals.recentRead >= 1 ? totals.recentRead - 1 : 0;
		}

		if (removeType === 'recent-played') {
			totals.recentPlayed = totals.recentPlayed >= 1 ? totals.recentPlayed - 1 : 0;
		}

		return {
			...previousState,
			articles,
			article,
			totals,
		};
	},
	CLEAR_ARTICLE_CONTENT: (previousState, action) => {
		return {
			...previousState,
			article: undefined,
		};
	},
	UPDATE_ARTICLE_CONTENT: (previousState, action) => {
		const article = action.article;
		const articles = { ...previousState.articles };
		const totals = { ...previousState.totals };

		if (articles[article.id] && articles[article.id].unread) {
			articles[article.id].unread = false;
			totals.recentRead = totals.recentRead + 1;
		}

		return {
			...previousState,
			totals,
			article,
			articles,
		};
	},
	STAR_ARTICLE: (previousState, action) => {
		let article = { ...previousState.article };
		if (article.id === action.articleId) {
			article.stared = true;
		}

		let totals = { ...previousState.totals };
		totals.star = totals.star >= 0 ? totals.star + 1 : 0;

		return {
			...previousState,
			article,
			totals,
		};
	},
	UNSTAR_ARTICLE: (previousState, action) => {
		let article = { ...previousState.article };
		if (article.id === action.articleId) {
			article.stared = false;
			article.stars = [];
		}

		let totals = { ...previousState.totals };
		totals.star = totals.star > 0 ? totals.star - 1 : 0;

		return {
			...previousState,
			article,
			totals,
		};
	},
	UPDATE_ARTICLE_STARS: (previousState, action) => {
		const article = { ...previousState.article };
		if (article.id === action.articleId) {
			if (action.star && action.star.tags) {
				article.stars = Array.isArray(action.star.tags) ? action.star.tags : [];
			} else if (!action.star) {
				article.stared = false;
				article.stars = [];
			}
		}
		return {
			...previousState,
			article,
		};
	},
	PLAY_EPISODE: (previousState, action) => {
		const player = { ...action.article, playing: true, open: true };
		delete player.description;
		delete player.content;

		let totals = { ...previousState.totals };
		let articles = { ...previousState.articles };
		if (articles[player.id] && !articles[player.id].played) {
			articles[player.id].played = true;
			totals.recentPlayed = totals.recentPlayed + 1;
		}

		return { ...previousState, totals, articles, player };
	},
	PAUSE_EPISODE: (previousState, action) => {
		return {
			...previousState,
			player: { ...previousState.player, playing: false },
		};
	},
	RESUME_EPISODE: (previousState, action) => {
		return {
			...previousState,
			player: { ...previousState.player, playing: true },
		};
	},
	CLOSE_PLAYER: (previousState, action) => {
		let existingState = { ...previousState };
		delete existingState.player;
		return { ...existingState };
	},
	BATCH_UPDATE_FEEDS: (previousState, action) => {
		const existingFeeds = previousState.feeds || [];
		return {
			...previousState,
			reachedEndOfFeeds: action.feeds.length < 20,
			feeds: [...existingFeeds, ...action.feeds],
		};
	},
	CLEAR_FEEDS: (previousState, action) => {
		return {
			...previousState,
			reachedEndOfFeeds: false,
			feeds: [],
		};
	},
	UPDATE_FOLDER_CHECKED: (previousState, action) => {
		let folders = { ...previousState.folders };
		let follows = { ...previousState.follows };
		const folderId = action.folderId;
		const followValues = Object.values(follows || {});

		if (folders[folderId].checked) {
			folders[folderId].checked = false;
		} else {
			folders[folderId].checked = true;
		}

		const folderFeeds = followValues.filter((f) => f.folderId === folderId);
		for (let feed of folderFeeds) {
			if (folders[folderId].checked && !follows[feed.id].checked) {
				follows[feed.id].checked = true;
			} else {
				follows[feed.id].checked = false;
			}
		}

		return {
			...previousState,
			folders,
			follows,
		};
	},
	UPDATE_FEED_CHECKED: (previousState, action) => {
		let folders = { ...previousState.folders };
		let follows = { ...previousState.follows };
		const folderId = action.folderId;
		const feedId = action.feedId;

		if (follows[feedId].checked) {
			follows[feedId].checked = false;
		} else {
			follows[feedId].checked = true;
		}

		if (folderId) {
			const followValues = Object.values(follows || {});
			const checkedFeeds = followValues.filter(
				(f) => f.folderId === folderId && f.checked,
			);
			if (checkedFeeds.length > 0) {
				folders[folderId].checked = true;
			} else {
				folders[folderId].checked = false;
			}
		}

		return {
			...previousState,
			folders,
			follows,
		};
	},
	UPDATE_COLLECTIONS_CHECKED: (previousState, action) => {
		let folders = { ...previousState.folders };
		let follows = { ...previousState.follows };
		const checkedAll = action.checkedAll;

		if (checkedAll) {
			for (const folderId in folders) {
				if (!folders[folderId].checked) {
					folders[folderId].checked = true;
				}
			}
			for (const feedId in follows) {
				if (!follows[feedId].checked) {
					follows[feedId].checked = true;
				}
			}
		} else {
			for (const folderId in folders) {
				if (folders[folderId].checked) {
					folders[folderId].checked = false;
				}
			}
			for (const feedId in follows) {
				if (follows[feedId].checked) {
					follows[feedId].checked = false;
				}
			}
		}

		return {
			...previousState,
			folders,
			follows,
		};
	},
};

// ------------------------------------
// Reducer
// ------------------------------------
const reducer = (previousState = {}, action) => {
	const handler = ACTION_HANDLERS[action.type];

	return handler ? handler(previousState, action) : previousState;
};

export default reducer;
