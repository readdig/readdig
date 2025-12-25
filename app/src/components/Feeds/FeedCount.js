import React from 'react';
import { useTranslation } from 'react-i18next';

import Total from '../Total';

const FeedCount = ({ unreadCount = 0, postCount = 0 }) => {
	const { t } = useTranslation();
	const unread = Number(unreadCount || 0);
	const total = Number(postCount || 0);

	return (
		<div
			className="count"
			title={`${t('Unread count')}: ${unread} / ${t('Article count')}: ${total}`}
		>
			{unread === 0 || unread === total ? (
				<Total
					value={total}
					className={unread > 0 ? 'unread' : 'total'}
					showTitle={false}
				/>
			) : (
				<>
					<Total value={unread} className="unread" showTitle={false} />
					<span className="separator">/</span>
					<Total value={total} className="total" showTitle={false} />
				</>
			)}
		</div>
	);
};

export default FeedCount;
