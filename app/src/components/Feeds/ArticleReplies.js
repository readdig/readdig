import React from 'react';
import { useTranslation } from 'react-i18next';

import Time from '../Time';
import { sanitizeHTML } from '../../utils/sanitize';

const ArticleReplies = ({ article = {} }) => {
	const { t } = useTranslation();
	const replies = Array.isArray(article.replies) ? article.replies : [];

	if (replies.length === 0) {
		return null;
	}

	// Most recent reply time, derived from the replies themselves.
	const lastReplyAt = replies.reduce((latest, reply) => {
		const time = new Date(reply.createdAt).getTime();
		return time > latest ? time : latest;
	}, 0);

	// Threaded sources (e.g. Hacker News) set `parentReplyId`; flat sources
	// (v2ex) leave it null, so every reply is a root and the list stays flat.
	const threaded = replies.some((reply) => reply.parentReplyId != null);

	// Group replies by parent. A reply whose parent isn't present is treated as a
	// root so nothing is dropped if a parent is missing/deleted.
	const ids = new Set(replies.map((reply) => reply.replyId));
	const byParent = new Map();
	for (const reply of replies) {
		const parent =
			reply.parentReplyId != null && ids.has(reply.parentReplyId)
				? reply.parentReplyId
				: null;
		if (!byParent.has(parent)) byParent.set(parent, []);
		byParent.get(parent).push(reply);
	}

	// Sequential floor numbers, only meaningful for flat sources.
	let floor = 0;

	const renderReply = (reply) => {
		const author = reply.author || {};
		floor += 1;
		const children = byParent.get(reply.replyId) || [];
		return (
			<li className="reply-item" key={reply.id}>
				<div className="reply">
					<div className="body">
						<div className="reply-meta">
							{author.url ? (
								<a
									href={author.url}
									target="_blank"
									rel="noopener noreferrer"
									className="username"
								>
									{author.name}
								</a>
							) : (
								<span className="username">{author.name}</span>
							)}
							{!threaded && <span className="floor">#{floor}</span>}
							<Time className="time" value={reply.createdAt} />
						</div>
						<div
							className="reply-content"
							dangerouslySetInnerHTML={{
								__html: sanitizeHTML(reply.contentRendered || reply.content),
							}}
						/>
					</div>
				</div>
				{children.length > 0 && (
					<ul className="replies-list nested">{children.map(renderReply)}</ul>
				)}
			</li>
		);
	};

	const roots = byParent.get(null) || [];

	return (
		<div className="article-replies">
			<div className="replies-header">
				<span className="count">{t('{{count}} replies', { count: replies.length })}</span>
				{lastReplyAt > 0 && (
					<span className="updated">
						{t('Last reply')} <Time value={lastReplyAt} format="lll" />
					</span>
				)}
			</div>
			<ul className="replies-list">{roots.map(renderReply)}</ul>
		</div>
	);
};

export default ArticleReplies;
