import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconFileText, IconFileTextFilled } from '@tabler/icons-react';

import Loader from '../Loader';
import { getArticleById } from '../../api/article';

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
		<span className="fulltext">
			<Loader />
		</span>
	) : (
		<>
			{!article.feed.fullText || (article.feed.fullText && !article.fullText) ? (
				<span
					className="fulltext"
					title={!fulltext ? t('Get full text') : t('Cancel full text')}
					onClick={onClick}
				>
					{!fulltext ? <IconFileText /> : <IconFileTextFilled />}
				</span>
			) : (
				<span className="fulltext" title={t('Auto full text')}>
					<IconFileTextFilled />
				</span>
			)}
		</>
	);
};

export default ArticleFulltext;
