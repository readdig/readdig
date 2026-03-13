// Shared weight constants for recommendation algorithms

export const FEED_WEIGHTS = {
	FEATURED: 10000,
	FOLLOWER: 5,
	LIKE: 2,
	FAILURE_PENALTY: 10,
	HAS_FEATURED_IMAGE: 50,
	HAS_ICON: 20,
	HAS_OG: 10,
	FULL_TEXT: 50,
};

export const ARTICLE_WEIGHTS = {
	BASE: 1,
	SAVED: 8,
	FOLLOWER: 2,
	LIKE: 5,
	VIEW: 0.1,
	PLAYED: 1,
	GRAVITY: 1.8,
};
