import { eq, like, asc, and, sql, or, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { lower } from '../db/lower';
import { folders, follows, feeds, articles, reads } from '../db/schema';
import { isFeedType } from '../utils/feed';

// buildConditions helper remains the same.
const buildConditions = ({ userId, folderId, searchText, type, status, alias }) => {
	const conditions = [];

	if (userId) {
		conditions.push(eq(alias.userId, userId));
	}

	if (folderId === null) {
		conditions.push(sql`${alias.folderId} IS NULL`);
	} else if (folderId) {
		conditions.push(eq(alias.folderId, folderId));
	}

	if (searchText) {
		const searchConditions = [
			like(lower(alias.alias), `%${searchText.toLowerCase()}%`),
			like(lower(alias.title), `%${searchText.toLowerCase()}%`),
		];
		if (folderId === undefined) {
			searchConditions.unshift(
				like(lower(folders.name), `%${searchText.toLowerCase()}%`),
			);
		}
		conditions.push(or(...searchConditions));
	}

	if (isFeedType(type)) {
		conditions.push(eq(alias.type, type));
	}

	if (status) {
		if (status === 'active') {
			conditions.push(eq(alias.valid, true));
		} else if (status === 'inactive') {
			conditions.push(eq(alias.valid, false));
		} else if (status === 'failure') {
			conditions.push(sql`${alias.consecutiveScrapeFailures} > 0`);
		}
	}

	return conditions;
};

exports.list = async (req, res) => {
	const userId = req.user.sub;
	const query = req.query || {};
	const searchText = decodeURIComponent(query.name || '').trim();

	// 1. CTE to filter relevant feeds. Selecting only necessary columns for the final output or subsequent JOINs.
	const filteredFeedsCTE = db.$with('filtered_feeds').as(
		db
			.select({
				// Feed-specific attributes directly needed in the final output.
				id: feeds.id,
				title: feeds.title, // This is the feed's original title
				url: feeds.url,
				type: feeds.type, // Feed type, e.g., 'rss', 'atom'
				valid: feeds.valid, // Feed validation status
				// For buildConditions alias, we need `feeds.consecutiveScrapeFailures`
				consecutiveScrapeFailures: feeds.consecutiveScrapeFailures,

				// Follow-specific attributes directly needed in the final output.
				// Renamed to avoid conflicts and maintain clarity in the CTE.
				followUserId: follows.userId,
				followFolderId: follows.folderId,
				followAlias: follows.alias, // User-defined alias for the feed
				followPrimary: follows.primary, // Indicates if it's a primary follow
				followFullText: follows.fullText, // Full text content preference
			})
			.from(follows)
			.innerJoin(feeds, eq(follows.feedId, feeds.id))
			.leftJoin(folders, eq(follows.folderId, folders.id))
			.where(
				and(
					eq(follows.userId, userId),
					...buildConditions({
						userId,
						folderId: query.folderId,
						searchText,
						type: query.type,
						status: query.status,
						// The alias object for buildConditions needs all potential fields for filtering.
						// It's okay if some are not selected in the final CTE result, as long as they are available for WHERE clauses.
						alias: { ...feeds, ...follows, name: folders.name },
					}),
				),
			),
	);

	// 2. CTE for unread counts. No changes here.
	const unreadCountsCTE = db.$with('unread_counts').as(
		db
			.select({
				feedId: articles.feedId,
				count: sql`COUNT(*)::int`.as('count'),
			})
			.from(articles)
			.innerJoin(filteredFeedsCTE, eq(articles.feedId, filteredFeedsCTE.id))
			.where(
				sql`NOT EXISTS (SELECT 1 FROM ${reads} r WHERE r.article_id = ${articles.id} AND r.user_id = ${userId})`,
			)
			.groupBy(articles.feedId),
	);

	// 3. CTE combining feeds with counts. Now only selecting fields explicitly used in the final JSON response.
	const feedsWithCountsCTE = db.$with('feeds_with_counts').as(
		db
			.select({
				// These are the fields that appear in the 'follows' array of your final JSON response
				id: filteredFeedsCTE.id,
				folderId: filteredFeedsCTE.followFolderId,
				primary: filteredFeedsCTE.followPrimary,
				fullText: filteredFeedsCTE.followFullText,
				alias: filteredFeedsCTE.followAlias,
				url: filteredFeedsCTE.url,
				type: filteredFeedsCTE.type,
				valid: filteredFeedsCTE.valid,
				// Calculated fields
				title:
					sql`CASE WHEN ${filteredFeedsCTE.followAlias} IS NOT NULL THEN ${filteredFeedsCTE.followAlias} ELSE ${filteredFeedsCTE.title} END`.as(
						'title',
					),
				unreadCount: sql`COALESCE(${unreadCountsCTE.count}, 0)`.as('unread_count'),
				// userId is needed for the where clause in noFolderQueryPromise
				userId: filteredFeedsCTE.followUserId,
			})
			.from(filteredFeedsCTE)
			.leftJoin(unreadCountsCTE, eq(filteredFeedsCTE.id, unreadCountsCTE.feedId)),
	);

	const queryBuilder = db.with(filteredFeedsCTE, unreadCountsCTE, feedsWithCountsCTE);

	// 4. Final queries.
	const foldersQueryPromise = queryBuilder
		.select({
			id: folders.id,
			name: folders.name,
			icon: folders.icon,
			follows: sql`COALESCE(
                json_agg(
                    json_build_object(
                        'id', ${feedsWithCountsCTE.id},
                        'folderId', ${feedsWithCountsCTE.folderId},
                        'primary', ${feedsWithCountsCTE.primary},
                        'fullText', ${feedsWithCountsCTE.fullText},
                        'alias', ${feedsWithCountsCTE.alias},
                        'title', ${feedsWithCountsCTE.title},
                        'url', ${feedsWithCountsCTE.url},
                        'type', ${feedsWithCountsCTE.type},
                        'valid', ${feedsWithCountsCTE.valid},
                        'unreadCount', ${feedsWithCountsCTE.unreadCount}
                    )
                    ORDER BY ${feedsWithCountsCTE.title} ASC
                ) FILTER (WHERE ${feedsWithCountsCTE.id} IS NOT NULL),
                '[]'::json
            )`,
		})
		.from(folders)
		.leftJoin(feedsWithCountsCTE, eq(feedsWithCountsCTE.folderId, folders.id))
		.where(
			and(
				eq(folders.userId, userId),
				query.folderId ? eq(folders.id, query.folderId) : undefined,
				isNotNull(feedsWithCountsCTE.id),
			),
		)
		.groupBy(folders.id, folders.name, folders.icon)
		.orderBy(asc(folders.name));

	let noFolderQueryPromise = Promise.resolve([]);
	if (!query.folderId) {
		noFolderQueryPromise = queryBuilder
			.select({
				id: feedsWithCountsCTE.id,
				folderId: feedsWithCountsCTE.folderId,
				primary: feedsWithCountsCTE.primary,
				fullText: feedsWithCountsCTE.fullText,
				alias: feedsWithCountsCTE.alias,
				title: feedsWithCountsCTE.title,
				url: feedsWithCountsCTE.url,
				type: feedsWithCountsCTE.type,
				valid: feedsWithCountsCTE.valid,
				unreadCount: feedsWithCountsCTE.unreadCount,
			})
			.from(feedsWithCountsCTE)
			.where(
				and(
					eq(feedsWithCountsCTE.userId, userId), // This relies on userId being selected in feedsWithCountsCTE
					sql`${feedsWithCountsCTE.folderId} IS NULL`,
				),
			)
			.orderBy(asc(feedsWithCountsCTE.title));
	}

	// 5. Combine results.
	const [result, noFolderFollows] = await Promise.all([
		foldersQueryPromise,
		noFolderQueryPromise,
	]);

	if (noFolderFollows.length > 0) {
		result.push({
			id: '0',
			name: 'UNGROUPED',
			icon: null,
			follows: noFolderFollows,
		});
	}

	res.json(result);
};
