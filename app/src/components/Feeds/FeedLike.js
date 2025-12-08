import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { likeFeed, unlikeFeed } from '../../api/feed';
import { ReactComponent as HeartRegularIcon } from '../../images/icons/heart-regular-full.svg';
import { ReactComponent as HeartSolidIcon } from '../../images/icons/heart-solid-full.svg';

const FeedLike = ({ feed = {} }) => {
	const { t } = useTranslation();
	const [liked, setLiked] = useState(feed.liked || false);

	const handleLike = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		setLiked((prev) => !prev);
		try {
			if (liked) {
				await unlikeFeed(feed.id);
			} else {
				await likeFeed(feed.id);
			}
		} catch (err) {
			setLiked((prev) => !prev);
		}
	};

	return (
		<button
			className="btn like"
			onClick={handleLike}
			title={liked ? t('Unlike feed') : t('Like feed')}
		>
			{liked ? <HeartSolidIcon /> : <HeartRegularIcon />}
		</button>
	);
};

export default FeedLike;
