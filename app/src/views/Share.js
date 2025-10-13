import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Loader from '../components/Loader';
import GoToTop from '../components/GoToTop';
import PageTitle from '../components/PageTitle';
import ArticleFeed from '../components/Feeds/ArticleFeed';
import ArticleContent from '../components/Feeds/ArticleContent';
import { getArticleById } from '../api/share';

const Share = () => {
	const scrollable = useRef();
	const { t } = useTranslation();
	const { shareId } = useParams();
	const [loading, setLoading] = useState(true);
	const [topHidden, setTopHidden] = useState(true);
	const [article, setArticle] = useState();

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (shareId) {
					setLoading(true);
					const res = await getArticleById(shareId);
					setArticle(res.data);
					setLoading(false);
				}
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [shareId]);

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
		<div className="share">
			<div className="share-scrolling" ref={scrollable} onScroll={onScroll}>
				{loading && (
					<div className="article-content">
						<Loader />
					</div>
				)}
				{!loading && !article && (
					<div className="article-content no-content">{t('No content found')}</div>
				)}
				{!loading && article && (
					<>
						<PageTitle title={article.title} />
						<div className="article-header">
							<ArticleFeed feed={article.feed} isLink={false} />
						</div>
						<ArticleContent article={article} />
					</>
				)}
				<GoToTop hidden={topHidden} onClick={scrollTop} />
			</div>
		</div>
	);
};

export default Share;
