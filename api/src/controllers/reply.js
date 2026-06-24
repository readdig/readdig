import { isUUID } from '../utils/validation';
import { db } from '../db';
import { articles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isV2EXEnabled, isV2EXArticle, syncV2EXReplies } from '../utils/v2ex';
import { isHNEnabled, isHNArticle, syncHNComments } from '../utils/hackernews';
import { isLinuxDOEnabled, isLinuxDOArticle, syncLinuxDOReplies } from '../utils/linuxdo';

exports.get = async (req, res) => {
	const articleId = req.params.articleId;

	if (!isUUID(articleId)) {
		return res.status(400).json(`Article Id (${articleId}) is an invalid UUId.`);
	}

	const [article] = await db
		.select({
			id: articles.id,
			url: articles.url,
			commentsUrl: articles.commentsUrl,
		})
		.from(articles)
		.where(eq(articles.id, articleId))
		.limit(1);
	if (!article) {
		return res.status(404).json('Article does not exist.');
	}

	let replies = [];

	if (isV2EXEnabled() && isV2EXArticle(article)) {
		try {
			replies = await syncV2EXReplies(article);
		} catch (err) {
			replies = [];
		}
	} else if (isHNEnabled() && isHNArticle(article)) {
		try {
			replies = await syncHNComments(article);
		} catch (err) {
			replies = [];
		}
	} else if (isLinuxDOEnabled() && isLinuxDOArticle(article)) {
		try {
			replies = await syncLinuxDOReplies(article);
		} catch (err) {
			replies = [];
		}
	}

	res.json(replies);
};
