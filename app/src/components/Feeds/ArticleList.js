import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { sort } from 'fast-sort';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';

import Loader from '../Loader';
import GoToTop from '../GoToTop';
import PageTitle from '../PageTitle';
import ArticleItem from './ArticleItem';
import UnfollowToast from './UnfollowToast';
import { getArticles, clearArticles } from '../../api/article';

const ArticleList = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const folders = useSelector((state) => state.folders || {});
	const follows = useSelector((state) => state.follows || {});
	const articles = useSelector((state) =>
		sort(Object.values(state.articles || {})).desc((a) => a.orderedAt),
	);
	const reachedEndOfArticles = useSelector(
		(state) => state.reachedEndOfArticles || false,
	);
	const { articleId, feedId, folderId } = useParams();
	const [hasMore, setHasMore] = useState(true);
	const [topHidden, setTopHidden] = useState(true);

	const perPage = 30;
	const articleCount = articles.length;
	const unreadOnly = (user.settings || {}).unreadOnly || false;
	const url = `${folderId ? '/folder/' + folderId : ''}${
		feedId ? '/feed/' + feedId : ''
	}`;

	const getFeedArticles = useCallback(
		async (nextParams) => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				const params = {
					feedId,
					folderId,
					unreadOnly,
					per_page: perPage,
					...nextParams,
				};
				source.current = axios.CancelToken.source();
				await getArticles(dispatch, params, source.current.token);
			} catch (err) {
				setHasMore(false);
			}
		},
		[dispatch, feedId, folderId, unreadOnly],
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
			<PageTitle
				title={
					follows[feedId]
						? follows[feedId].title
						: folders[folderId]
						? folders[folderId].name
						: t('Primary')
				}
			/>
			<UnfollowToast
				feedId={feedId}
				duplicateOf={articles[0] ? articles[0].feed.duplicateOf : undefined}
			/>
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
								to={`${url}/article/${article.id}`}
								key={article.id}
								article={article}
								currentId={articleId}
								visited={true}
							/>
						);
					})}
				</InfiniteScroll>
				<GoToTop hidden={topHidden} onClick={scrollTop} />
			</div>
		</>
	);
};

export default ArticleList;
