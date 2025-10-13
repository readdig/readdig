import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { decodeHTML } from 'entities';
import { useTranslation } from 'react-i18next';

import Image from '../Image';
import TimeAgo from '../TimeAgo';
import PlayOrPause from './PlayOrPause';

import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const ArticleItem = ({
	to,
	article = {},
	currentId,
	visited = false,
	removed = false,
	onRemove,
}) => {
	const { t } = useTranslation();

	const playable = article.feed.type === 'podcast' && article.type === 'episode';
	const desc = decodeHTML(article.description);

	return (
		<Link
			className={classNames('article-item', {
				visited: visited && !article.unread,
				active: currentId && currentId === article.id,
			})}
			to={to}
		>
			<div className="left">
				<div className="icon">
					<Image relative={true} src={`/images/article/${article.id}?w=120&h=120`} />
					{playable && <PlayOrPause article={article} />}
				</div>
				{article.unread && <div className="unread" />}
			</div>
			<div className="right">
				<h4 title={article.title}>{article.title}</h4>
				{desc && <div className="desc">{desc}</div>}
				<div className="meta">
					<TimeAgo className="time" value={article.createdAt} />
					<span className="feed" title={article.feed.title}>
						{article.feed.title}
					</span>
				</div>
				{removed && (
					<div className="remove" onClick={onRemove} title={t('Remove')}>
						<ExitIcon />
					</div>
				)}
			</div>
		</Link>
	);
};

export default ArticleItem;
