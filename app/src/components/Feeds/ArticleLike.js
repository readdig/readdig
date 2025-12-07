import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { likeArticle, unlikeArticle } from '../../api/article';
import { ReactComponent as HeartRegularIcon } from '../../images/icons/heart-regular-full.svg';
import { ReactComponent as HeartSolidIcon } from '../../images/icons/heart-solid-full.svg';

const ArticleLike = ({ article = {} }) => {
	const { t } = useTranslation();
	const [liked, setLiked] = useState(article.liked || false);

	const handleLike = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		setLiked((prev) => !prev);
		try {
			if (liked) {
				await unlikeArticle(article.id);
			} else {
				await likeArticle(article.id);
			}
		} catch (error) {
			setLiked((prev) => !prev);
		}
	};

	return (
		<span
			className="like"
			onClick={handleLike}
			title={liked ? t('Unlike article') : t('Like article')}
		>
			{liked ? <HeartSolidIcon /> : <HeartRegularIcon />}
		</span>
	);
};

export default ArticleLike;
