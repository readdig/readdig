import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { sort } from 'fast-sort';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';

import Loader from '../Loader';
import GoToTop from '../GoToTop';
import PageTitle from '../PageTitle';
import ArticleItem from './ArticleItem';
import TagPanel from '../Tags/TagPanel';
import { getArticles, removeArticle, clearArticles } from '../../api/article';

const StarArticleList = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const articles = useSelector((state) =>
		sort(Object.values(state.articles || {})).desc((a) => a.orderedAt),
	);
	const reachedEndOfArticles = useSelector(
		(state) => state.reachedEndOfArticles || false,
	);
	const { articleId } = useParams();
	const [hasMore, setHasMore] = useState(true);
	const [tagId, setTagId] = useState();
	const [topHidden, setTopHidden] = useState(true);

	const perPage = 30;
	const articleType = 'stars';
	const articleCount = articles.length;

	const getFeedArticles = useCallback(
		async (nextParams) => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				const params = {
					type: articleType,
					tagId,
					per_page: perPage,
					...nextParams,
				};
				source.current = axios.CancelToken.source();
				await getArticles(dispatch, params, source.current.token);
			} catch (err) {
				setHasMore(false);
			}
		},
		[dispatch, tagId],
	);

	const clearFeedArticles = useCallback(() => {
		clearArticles(dispatch);
	}, [dispatch]);

	useEffect(() => {
		getFeedArticles();

		return () => {
			if (source && source.current) {
				source.current.cancel();
			}
			clearFeedArticles();
		};
	}, [getFeedArticles, clearFeedArticles]);

	useEffect(() => {
		if (articleCount >= 1000 || reachedEndOfArticles) {
			setHasMore(false);
		}

		return () => {
			setHasMore(true);
		};
	}, [articleCount, reachedEndOfArticles]);

	const onRemove = async (e, articleId) => {
		e.preventDefault();
		e.stopPropagation();

		toast.dismiss();
		await removeArticle(dispatch, articleType, articleId);
	};

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
		<>
			<PageTitle title={t('Stars')} />
			<TagPanel onChange={setTagId} />
			<div className="article-scrolling" ref={scrollable}>
				<InfiniteScroll
					key={scrollable.current}
					scrollableTarget={scrollable.current}
					dataLength={articleCount}
					onScroll={onScroll}
					next={() => {
						if (articleCount > 0) {
							const endOfArticle = articles[articleCount - 1];
							const endOfArticleIds = articles
								.filter((a) => a.orderedAt === endOfArticle.orderedAt)
								.map((a) => a.id);
							getFeedArticles({
								endOfCreatedAt: endOfArticle.orderedAt,
								endOfArticleIds: endOfArticleIds.join(','),
							});
						}
					}}
					hasMore={hasMore}
					loader={
						<div className="end-loader">
							<Loader />
						</div>
					}
					endMessage={
						<div className="end">
							<p>{t('No more articles')}</p>
						</div>
					}
					refreshFunction={() => {
						clearFeedArticles();
						getFeedArticles();
					}}
					pullDownToRefresh={isMobile}
					pullDownToRefreshThreshold={80}
					pullDownToRefreshContent={<div className="pull-loader down">&#8595;</div>}
					releaseToRefreshContent={<div className="pull-loader up">&#8595;</div>}
				>
					{articles.map((article) => {
						return (
							<ArticleItem
								to={`/stars/article/${article.id}`}
								key={article.id}
								article={article}
								currentId={articleId}
								removed={true}
								onRemove={(e) => onRemove(e, article.id)}
							/>
						);
					})}
				</InfiniteScroll>
				<GoToTop hidden={topHidden} onClick={scrollTop} />
			</div>
		</>
	);
};

export default StarArticleList;
