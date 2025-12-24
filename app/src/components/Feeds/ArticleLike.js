import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';

import { likeArticle, unlikeArticle } from '../../api/article';

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
		} catch (err) {
			setLiked((prev) => !prev);
		}
	};

	return (
		<span
			className="like"
			onClick={handleLike}
			title={liked ? t('Unlike article') : t('Like article')}
		>
			{liked ? <IconHeartFilled /> : <IconHeart />}
		</span>
	);
};

export default ArticleLike;
