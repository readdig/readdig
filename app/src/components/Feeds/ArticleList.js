import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { sort } from 'fast-sort';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';

import Loader from '../Loader';
import GoToTop from '../GoToTop';
import PageTitle from '../PageTitle';
import ArticleItem from './ArticleItem';
import UnfollowToast from './UnfollowToast';
import useMobileAndTouch from '../../hooks/useMobileAndTouch';
import { getArticles, clearArticles, markArticlesRead } from '../../api/article';

const ArticleList = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const isMobileAndTouch = useMobileAndTouch();
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
	const url = `${folderId ? '/folder/' + folderId : ''}${
		feedId ? '/feed/' + feedId : ''
	}`;

	const settings = user.settings || {};
	const unreadOnly = settings.unreadOnly || false;
	const autoRead = settings.autoRead || false;
	const scrollRootId = 'article-scrolling';
	const isScrollAutoRead = useMemo(() => {
		if (!autoRead) return false;
		return isMobileAndTouch;
	}, [autoRead, isMobileAndTouch]);

	// Auto-read: mobile IntersectionObserver
	const ioRef = useRef(null);
	const articlesMapRef = useRef({});
	const autoReadTimers = useRef({});
	const visibleOnce = useRef({});
	const observedEls = useRef(new WeakSet());
	const scrollStopTimer = useRef(null);
	const mutationObserverRef = useRef(null);
	const observeRafRef = useRef(null);
	const observeDebounceRef = useRef(null);
	const pastTopIds = useRef(new Set());

	// Keep articlesMap ref in sync
	useEffect(() => {
		const map = {};
		articles.forEach((a) => {
			map[a.id] = a;
		});
		articlesMapRef.current = map;
		Object.keys(visibleOnce.current).forEach((id) => {
			if (!map[id]) {
				delete visibleOnce.current[id];
			}
		});
		Object.keys(autoReadTimers.current).forEach((id) => {
			if (!map[id]) {
				clearTimeout(autoReadTimers.current[id]);
				delete autoReadTimers.current[id];
			}
		});
	}, [articles]);

	// Auto-read: PC hover handler
	const handleAutoRead = useCallback(
		(article) => {
			if (!autoRead || !article.unread) return;
			markArticlesRead(dispatch, article);
		},
		[dispatch, autoRead],
	);

	// Auto-read: mark unread articles above visible area
	const handleIOEntries = useCallback((entries) => {
		entries.forEach((entry) => {
			const el = entry.target;
			const id = el.dataset.articleId;
			if (!id) return;

			if (entry.isIntersecting) {
				pastTopIds.current.delete(id);
				if (autoReadTimers.current[id]) return;
				autoReadTimers.current[id] = setTimeout(() => {
					delete autoReadTimers.current[id];
					visibleOnce.current[id] = true;
				}, 1000);
				return;
			}

			if (autoReadTimers.current[id]) {
				clearTimeout(autoReadTimers.current[id]);
				delete autoReadTimers.current[id];
			}

			if (entry.rootBounds && entry.boundingClientRect.bottom < entry.rootBounds.top) {
				pastTopIds.current.add(id);
			} else {
				pastTopIds.current.delete(id);
			}
		});
	}, []);

	const scanScrolledPast = useCallback(() => {
		const toMark = [];
		pastTopIds.current.forEach((id) => {
			if (visibleOnce.current[id]) {
				const article = articlesMapRef.current[id];
				if (article && article.unread) {
					toMark.push(article);
				}
				delete visibleOnce.current[id];
			}
		});
		pastTopIds.current.clear();

		if (toMark.length > 0) {
			markArticlesRead(dispatch, toMark);
		}
	}, [dispatch]);

	const onScroll = (e) => {
		if (e.target.scrollTop > 80) {
			setTopHidden(false);
		} else if (e.target.scrollTop < 80) {
			setTopHidden(true);
		}

		if (isScrollAutoRead) {
			if (scrollStopTimer.current) {
				clearTimeout(scrollStopTimer.current);
			}
			scrollStopTimer.current = setTimeout(scanScrolledPast, 150);
		}
	};

	const observeAll = useCallback(() => {
		if (!ioRef.current) return;
		const root = document.getElementById(scrollRootId);
		if (!root) return;
		if (observeDebounceRef.current) {
			clearTimeout(observeDebounceRef.current);
		}
		observeDebounceRef.current = setTimeout(() => {
			observeDebounceRef.current = null;
			if (observeRafRef.current) {
				cancelAnimationFrame(observeRafRef.current);
			}
			observeRafRef.current = requestAnimationFrame(() => {
				const elements = root.querySelectorAll('[data-article-id]');
				elements.forEach((el) => {
					if (!observedEls.current.has(el)) {
						observedEls.current.add(el);
						ioRef.current.observe(el);
					}
				});
			});
		}, 80);
	}, [scrollRootId]);

	useEffect(() => {
		if (!isScrollAutoRead) return;
		const root = document.getElementById(scrollRootId);
		if (!root) return;
		const observer = new IntersectionObserver(handleIOEntries, {
			root,
			threshold: 0,
		});
		ioRef.current = observer;
		observeAll();
		const mutationObserver = new MutationObserver(() => observeAll());
		mutationObserver.observe(root, { childList: true, subtree: true });
		mutationObserverRef.current = mutationObserver;
		const timers = autoReadTimers.current;
		const seen = visibleOnce.current;
		const pastTop = pastTopIds.current;

		return () => {
			observer.disconnect();
			ioRef.current = null;
			if (mutationObserverRef.current) {
				mutationObserverRef.current.disconnect();
				mutationObserverRef.current = null;
			}
			if (observeRafRef.current) {
				cancelAnimationFrame(observeRafRef.current);
				observeRafRef.current = null;
			}
			if (observeDebounceRef.current) {
				clearTimeout(observeDebounceRef.current);
				observeDebounceRef.current = null;
			}
			Object.keys(timers).forEach((id) => {
				clearTimeout(timers[id]);
				delete timers[id];
			});
			Object.keys(seen).forEach((id) => {
				delete seen[id];
			});
			if (scrollStopTimer.current) {
				clearTimeout(scrollStopTimer.current);
				scrollStopTimer.current = null;
			}
			pastTop.clear();
		};
	}, [handleIOEntries, isScrollAutoRead, observeAll, scrollRootId]);

	useEffect(() => {
		if (!isScrollAutoRead) return;
		observeAll();
	}, [articles, isScrollAutoRead, observeAll]);

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
			<div className="article-scrolling" id={scrollRootId} ref={scrollable}>
				<InfiniteScroll
					key={scrollable.current}
					scrollableTarget={scrollRootId}
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
					pullDownToRefresh={isMobileAndTouch}
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
								onAutoRead={autoRead && !isScrollAutoRead ? handleAutoRead : undefined}
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
