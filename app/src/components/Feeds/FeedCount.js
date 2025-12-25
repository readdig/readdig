import React from 'react';
import { useTranslation } from 'react-i18next';

import Total from '../Total';

const FeedCount = ({ unreadCount = 0 }) => {
	const { t } = useTranslation();
	const unread = Number(unreadCount || 0);

	return (
		<div className="count" title={`${t('Unread count')}: ${unread}`}>
			{<Total value={unread} />}
		</div>
	);
};

export default FeedCount;
