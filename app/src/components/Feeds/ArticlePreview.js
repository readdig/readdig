import axios from 'axios';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Loader from '../Loader';
import GoToTop from '../GoToTop';
import PageTitle from '../PageTitle';
import ArticleHeader from './ArticleHeader';
import ArticleContent from './ArticleContent';
import { getArticleById } from '../../api/article';

const ArticlePreview = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const { articleId } = useParams();
	const [loading, setLoading] = useState(false);
	const [topHidden, setTopHidden] = useState(true);
	const article = useSelector((state) => state.article);

	const clearArticleContent = useCallback(() => {
		dispatch({
			type: 'CLEAR_ARTICLE_CONTENT',
		});
	}, [dispatch]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				if (articleId) {
					setLoading(true);
					source.current = axios.CancelToken.source();
					await getArticleById(dispatch, articleId, null, source.current.token);
					setLoading(false);
				}
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();

		return () => {
			if (source && source.current) {
				source.current.cancel();
			}
			clearArticleContent();
		};
	}, [dispatch, articleId, clearArticleContent]);

	const onScroll = (e) => {
		if (e.target.scrollTop > 80) {
			setTopHidden(false);
		} else if (e.target.scrollTop < 80) {
			setTopHidden(true);
		}
	};

	const scrollTop = () => {
		scrollable.current.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<div className="article-preview" ref={scrollable} onScroll={onScroll}>
			{loading && (
				<div className="article-content">
					<Loader />
				</div>
			)}
			{!loading && !article && (
				<div className="article-content">
					<div className="no-content">{t('No selected content')}</div>
				</div>
			)}
			{!loading && article && (
				<>
					<PageTitle title={article.title} />
					<ArticleHeader article={article} />
					<ArticleContent article={article} />
				</>
			)}
			<GoToTop hidden={topHidden} onClick={scrollTop} />
		</div>
	);
};

export default ArticlePreview;
