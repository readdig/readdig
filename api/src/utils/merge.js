import { eq, and, inArray, or, sql } from 'drizzle-orm';

import { db } from '../db';
import {
	feeds,
	articles,
	follows,
	stars,
	reads,
	listens,
	likes,
	feedCategories,
} from '../db/schema';

// Move rFeed's followers onto lFeed. follows are unique per
// (userId, feedId, folderId) and (userId, feedId, alias). An rFeed follow is
// dropped only when moving it would actually clash on lFeed: the same user
// already has a follow in that folder (non-null folderId), or with that alias
// (non-null alias), or an identical (folderId, alias) row. Postgres treats NULL
// folderId/alias as distinct, so two root follows with different aliases are
// kept rather than collapsed.
const mergeFollows = async (tx, lFeedId, rFeedId) => {
	const [lFollows, rFollows] = await Promise.all([
		tx
			.select({
				userId: follows.userId,
				folderId: follows.folderId,
				alias: follows.alias,
			})
			.from(follows)
			.where(eq(follows.feedId, lFeedId)),
		tx
			.select({
				id: follows.id,
				userId: follows.userId,
				folderId: follows.folderId,
				alias: follows.alias,
			})
			.from(follows)
			.where(eq(follows.feedId, rFeedId)),
	]);

	const folderKey = (f) => `${f.userId}:${f.folderId}`;
	const aliasKey = (f) => `${f.userId}:${f.alias}`;
	const exactKey = (f) => `${f.userId}:${f.folderId ?? ''}:${f.alias ?? ''}`;

	const folderKeys = new Set(lFollows.filter((f) => f.folderId != null).map(folderKey));
	const aliasKeys = new Set(lFollows.filter((f) => f.alias != null).map(aliasKey));
	const exactKeys = new Set(lFollows.map(exactKey));

	const toMove = [];
	const toRemove = [];
	for (const f of rFollows) {
		const clashes =
			(f.folderId != null && folderKeys.has(folderKey(f))) ||
			(f.alias != null && aliasKeys.has(aliasKey(f))) ||
			exactKeys.has(exactKey(f));

		if (clashes) {
			toRemove.push(f.id);
		} else {
			if (f.folderId != null) folderKeys.add(folderKey(f));
			if (f.alias != null) aliasKeys.add(aliasKey(f));
			exactKeys.add(exactKey(f));
			toMove.push(f.id);
		}
	}

	if (toMove.length > 0) {
		await tx
			.update(follows)
			.set({ feedId: lFeedId, updatedAt: new Date() })
			.where(inArray(follows.id, toMove));
	}
	if (toRemove.length > 0) {
		await tx.delete(follows).where(inArray(follows.id, toRemove));
	}
};

// Per-user article state that lives in its own row keyed by (userId, articleId).
// When a duplicate article is folded into a surviving one, these rows must be
// re-pointed at the survivor. `touch` is false for `likes`, which has no
// updatedAt column.
const ARTICLE_STATE_TABLES = [
	{ table: stars, touch: true },
	{ table: reads, touch: true },
	{ table: listens, touch: true },
	{ table: likes, touch: false },
];

// Re-point one per-user article-state table from the duplicate rFeed articles to
// their surviving lFeed articles, deduping on the (userId, articleId) unique key
// (a row whose user already has state on the survivor is dropped instead).
const repointArticleState = async (tx, table, touch, dupMap, dupIds, targetIds) => {
	const [rRows, lRows] = await Promise.all([
		tx
			.select({ id: table.id, userId: table.userId, articleId: table.articleId })
			.from(table)
			.where(inArray(table.articleId, dupIds)),
		tx
			.select({ userId: table.userId, articleId: table.articleId })
			.from(table)
			.where(inArray(table.articleId, targetIds)),
	]);

	if (rRows.length === 0) {
		return;
	}

	const keys = new Set(lRows.map((r) => `${r.userId}:${r.articleId}`));
	const remove = [];
	for (const r of rRows) {
		const targetArticleId = dupMap.get(r.articleId);
		const key = `${r.userId}:${targetArticleId}`;
		if (keys.has(key)) {
			remove.push(r.id);
		} else {
			keys.add(key);
			await tx
				.update(table)
				.set(
					touch
						? { articleId: targetArticleId, updatedAt: new Date() }
						: { articleId: targetArticleId },
				)
				.where(eq(table.id, r.id));
		}
	}
	if (remove.length > 0) {
		await tx.delete(table).where(inArray(table.id, remove));
	}
};

// Move rFeed's articles onto lFeed. Articles are unique per feed on both
// (feedId, guid) and (feedId, fingerprint); a non-colliding article is
// reassigned to lFeed, while one that already exists in lFeed is kept but
// marked as a duplicate (preserving its per-user state) and has that state
// (stars/reads/listens/likes) re-pointed at the surviving lFeed article.
const mergeArticlesAndState = async (tx, lFeedId, rFeedId) => {
	const rArticles = await tx
		.select({
			id: articles.id,
			guid: articles.guid,
			fingerprint: articles.fingerprint,
		})
		.from(articles)
		.where(eq(articles.feedId, rFeedId));

	if (rArticles.length === 0) {
		return;
	}

	const rGuids = rArticles.map((a) => a.guid);
	const rFingerprints = rArticles.map((a) => a.fingerprint);

	const lMatches = await tx
		.select({
			id: articles.id,
			guid: articles.guid,
			fingerprint: articles.fingerprint,
		})
		.from(articles)
		.where(
			and(
				eq(articles.feedId, lFeedId),
				or(inArray(articles.guid, rGuids), inArray(articles.fingerprint, rFingerprints)),
			),
		);

	const lByGuid = new Map(lMatches.map((a) => [a.guid, a.id]));
	const lByFingerprint = new Map(lMatches.map((a) => [a.fingerprint, a.id]));

	const toMove = [];
	const toMark = []; // rFeed articles that already exist in lFeed
	for (const a of rArticles) {
		const targetId = lByGuid.get(a.guid) ?? lByFingerprint.get(a.fingerprint);
		if (targetId) {
			toMark.push({ id: a.id, duplicateOfId: targetId });
		} else {
			toMove.push(a.id);
		}
	}

	if (toMove.length > 0) {
		await tx
			.update(articles)
			.set({ feedId: lFeedId, updatedAt: new Date() })
			.where(inArray(articles.id, toMove));
	}

	if (toMark.length === 0) {
		return;
	}

	// Re-point each per-user state table from the duplicate rFeed articles to
	// their surviving lFeed articles, deduping on (userId, articleId).
	const dupMap = new Map(toMark.map((m) => [m.id, m.duplicateOfId]));
	const dupIds = toMark.map((m) => m.id);
	const targetIds = [...new Set(toMark.map((m) => m.duplicateOfId))];

	for (const { table, touch } of ARTICLE_STATE_TABLES) {
		await repointArticleState(tx, table, touch, dupMap, dupIds, targetIds);
	}

	// Resync the denormalized articles.likes counter for every article whose
	// like rows just changed: survivors that gained likes and duplicates that
	// lost them.
	const likeAffected = [...new Set([...targetIds, ...dupIds])];
	await tx
		.update(articles)
		.set({
			likes: sql`(SELECT COUNT(*) FROM likes WHERE likes.article_id = ${articles.id})`,
			updatedAt: new Date(),
		})
		.where(inArray(articles.id, likeAffected));

	for (const m of toMark) {
		await tx
			.update(articles)
			.set({ duplicateOfId: m.duplicateOfId, updatedAt: new Date() })
			.where(eq(articles.id, m.id));
	}
};

// Move rFeed's feed-level likes onto lFeed, deduping on the (userId, feedId)
// unique key, then resync the denormalized feeds.likes counter on both feeds.
const mergeFeedLikes = async (tx, lFeedId, rFeedId) => {
	const [rLikes, lLikes] = await Promise.all([
		tx
			.select({ id: likes.id, userId: likes.userId })
			.from(likes)
			.where(eq(likes.feedId, rFeedId)),
		tx.select({ userId: likes.userId }).from(likes).where(eq(likes.feedId, lFeedId)),
	]);

	if (rLikes.length === 0) {
		return;
	}

	const lUsers = new Set(lLikes.map((l) => l.userId));
	const toMove = [];
	const toRemove = [];
	for (const l of rLikes) {
		if (lUsers.has(l.userId)) {
			toRemove.push(l.id);
		} else {
			lUsers.add(l.userId);
			toMove.push(l.id);
		}
	}

	if (toMove.length > 0) {
		await tx.update(likes).set({ feedId: lFeedId }).where(inArray(likes.id, toMove));
	}
	if (toRemove.length > 0) {
		await tx.delete(likes).where(inArray(likes.id, toRemove));
	}

	await tx
		.update(feeds)
		.set({
			likes: sql`(SELECT COUNT(*) FROM likes WHERE likes.feed_id = ${feeds.id})`,
			updatedAt: new Date(),
		})
		.where(inArray(feeds.id, [lFeedId, rFeedId]));
};

// Move rFeed's category links onto lFeed so the survivor inherits rFeed's
// categories, deduping on the (feedId, categoryId) unique key.
const mergeFeedCategories = async (tx, lFeedId, rFeedId) => {
	const [rCats, lCats] = await Promise.all([
		tx
			.select({ id: feedCategories.id, categoryId: feedCategories.categoryId })
			.from(feedCategories)
			.where(eq(feedCategories.feedId, rFeedId)),
		tx
			.select({ categoryId: feedCategories.categoryId })
			.from(feedCategories)
			.where(eq(feedCategories.feedId, lFeedId)),
	]);

	if (rCats.length === 0) {
		return;
	}

	const lCategoryIds = new Set(lCats.map((c) => c.categoryId));
	const toMove = [];
	const toRemove = [];
	for (const c of rCats) {
		if (lCategoryIds.has(c.categoryId)) {
			toRemove.push(c.id);
		} else {
			lCategoryIds.add(c.categoryId);
			toMove.push(c.id);
		}
	}

	if (toMove.length > 0) {
		await tx
			.update(feedCategories)
			.set({ feedId: lFeedId })
			.where(inArray(feedCategories.id, toMove));
	}
	if (toRemove.length > 0) {
		await tx.delete(feedCategories).where(inArray(feedCategories.id, toRemove));
	}
};

// Fold rFeed's URLs into lFeed's feedUrls so lookups for the merged feed still
// resolve to the survivor. lFeed.feedUrl stays the primary URL.
const mergeFeedUrls = async (tx, lFeed, rFeed) => {
	const feedUrls = [
		...new Set(
			[rFeed.feedUrl, ...(lFeed.feedUrls || []), ...(rFeed.feedUrls || [])]
				.filter(Boolean)
				.filter((url) => url !== lFeed.feedUrl),
		),
	];

	await tx
		.update(feeds)
		.set({ feedUrls, updatedAt: new Date() })
		.where(eq(feeds.id, lFeed.id));
};

// Merge rFeed into lFeed: lFeed is the surviving canonical feed, rFeed becomes a
// duplicate of it. Runs in a single transaction so a failure leaves nothing
// half-merged. Marking rFeed.duplicateOfId also removes it from scraping (the
// conductor only schedules feeds where duplicate_of_id IS NULL).
export const mergeFeeds = async (lFeedId, rFeedId) => {
	if (lFeedId === rFeedId) {
		throw new Error('Cannot merge a feed into itself.');
	}

	return db.transaction(async (tx) => {
		const [lFeed, rFeed] = await Promise.all([
			tx.query.feeds.findFirst({ where: eq(feeds.id, lFeedId) }),
			tx.query.feeds.findFirst({ where: eq(feeds.id, rFeedId) }),
		]);

		if (!lFeed || !rFeed) {
			throw new Error('Feed does not exist.');
		}

		// Re-check inside the transaction: a concurrent merge could have turned
		// either feed into a duplicate after the controller's pre-check.
		if (lFeed.duplicateOfId || rFeed.duplicateOfId) {
			throw new Error('Cannot merge a feed that is already a duplicate.');
		}

		await mergeFollows(tx, lFeedId, rFeedId);
		await mergeArticlesAndState(tx, lFeedId, rFeedId);
		await mergeFeedLikes(tx, lFeedId, rFeedId);
		await mergeFeedCategories(tx, lFeedId, rFeedId);
		await mergeFeedUrls(tx, lFeed, rFeed);

		await tx
			.update(feeds)
			.set({ duplicateOfId: lFeedId, updatedAt: new Date() })
			.where(eq(feeds.id, rFeedId));
	});
};
