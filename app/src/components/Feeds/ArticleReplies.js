import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconHeartFilled } from '@tabler/icons-react';

import Time from '../Time';
import { sanitizeHTML } from '../../utils/sanitize';

const ArticleReplies = ({ article = {} }) => {
	const { t } = useTranslation();
	const replies = Array.isArray(article.replies) ? article.replies : [];

	if (replies.length === 0) {
		return null;
	}

	// Last reply time, derived from the replies themselves.
	const lastReplyAt = replies.reduce((latest, reply) => {
		const time = new Date(reply.datePublished).getTime();
		return time > latest ? time : latest;
	}, 0);

	return (
		<div className="article-replies">
			<div className="replies-header">
				<span className="count">
					{t('{{count}} replies', { count: replies.length })}
				</span>
				{lastReplyAt > 0 && (
					<span className="updated">
						{t('Updated')} <Time value={lastReplyAt} format="lll" />
					</span>
				)}
			</div>
			<ul className="replies-list">
				{replies.map((reply) => {
					const author = reply.author || {};
					return (
						<li className="reply" key={reply.id}>
							<div className="avatar">
								{author.avatar ? (
									<img
										src={author.avatar}
										alt={author.name}
										referrerPolicy="no-referrer"
									/>
								) : (
									<div className="placeholder" />
								)}
							</div>
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
									<span className="floor">#{reply.floor}</span>
									<Time className="time" value={reply.datePublished} />
									{reply.thanks > 0 && (
										<span className="thanks">
											<IconHeartFilled size={14} />
											{reply.thanks}
										</span>
									)}
								</div>
								<div
									className="reply-content"
									dangerouslySetInnerHTML={{
										__html: sanitizeHTML(reply.contentRendered || reply.content),
									}}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default ArticleReplies;
