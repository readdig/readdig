import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Loader from '../Loader';
import { getArticleById } from '../../api/article';

import { ReactComponent as TextBoxIcon } from '../../images/icons/text-box.svg';
import { ReactComponent as TextBoxOutlineIcon } from '../../images/icons/text-box-outline.svg';
import { ReactComponent as TextBoxCheckIcon } from '../../images/icons/text-box-check.svg';

const ArticleFulltext = ({ article = {} }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [fulltext, setFulltext] = useState(false);

	const onClick = async () => {
		try {
			setLoading(true);
			await getArticleById(dispatch, article.id, !fulltext ? { type: 'parsed' } : null);
			setLoading(false);
			setFulltext(!fulltext);
		} catch (err) {
			setLoading(false);
		}
	};

	return loading ? (
		<Loader />
	) : (
		<>
			{!article.feed.fullText || (article.feed.fullText && !article.fullText) ? (
				<span
					className="fulltext"
					title={!fulltext ? t('Get full text') : t('Cancel full text')}
					onClick={onClick}
				>
					{!fulltext ? <TextBoxOutlineIcon /> : <TextBoxIcon />}
				</span>
			) : (
				<span className="fulltext" title={t('Auto full text')}>
					<TextBoxCheckIcon />
				</span>
			)}
		</>
	);
};

export default ArticleFulltext;
