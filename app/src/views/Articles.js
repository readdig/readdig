import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Select from 'react-select';

import PageTitle from '../components/PageTitle';
import SearchInput from '../components/SearchInput';
import Loader from '../components/Loader';
import ArticleItem from '../components/Feeds/ArticleItem';
import GoToTop from '../components/GoToTop';

import { getFeaturedArticles } from '../api/featured';
import { search } from '../api/search';
import fetch from '../utils/fetch';

const PER_PAGE = 20;

const Articles = () => {
	const source = useRef();
	const scrollable = useRef();
	const { t } = useTranslation();

	// Articles state
	const [articleQuery, setArticleQuery] = useState('');
	const [articleFilterType, setArticleFilterType] = useState('articles');
	const [articleResults, setArticleResults] = useState([]);
	const [featuredArticles, setFeaturedArticles] = useState([]);
	const [articleLoading, setArticleLoading] = useState(false);
	const [articleSearched, setArticleSearched] = useState(false);
	const [featuredLoaded, setFeaturedLoaded] = useState(false);
	const [topHidden, setTopHidden] = useState(true);

	// Pagination state for search
	const [searchPage, setSearchPage] = useState(1);
	const [searchHasMore, setSearchHasMore] = useState(true);

	// Article filter options (excluding feeds)
	const articleFilterOptions = useMemo(
		() => [
			{ value: 'articles', label: t('All') },
			{ value: 'stars', label: t('Stars') },
			{ value: 'recent-read', label: t('Recent Read') },
			{ value: 'recent-played', label: t('Recent Played') },
		],
		[t],
	);

	// Reset pagination when query or filter type changes
	useEffect(() => {
		setSearchPage(1);
		setArticleResults([]);
		setSearchHasMore(false);
		// Always reset searched state when query changes to avoid showing "No results" flash
		setArticleSearched(false);
	}, [articleQuery, articleFilterType]);

	// Load featured articles on mount (no pagination)
	useEffect(() => {
		if (featuredLoaded) return;

		const loadFeaturedArticles = async () => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				source.current = axios.CancelToken.source();
				setArticleLoading(true);
				const res = await getFeaturedArticles(
					{ page: 1, per_page: 50 },
					source.current.token,
				);
				setFeaturedArticles(res.data || []);
				setFeaturedLoaded(true);
			} catch (err) {
				if (!axios.isCancel(err)) {
					console.error(err);
				}
			} finally {
				setArticleLoading(false);
			}
		};

		loadFeaturedArticles();

		return () => {
			if (source && source.current) {
				source.current.cancel();
			}
		};
	}, [featuredLoaded]);

	// Article search effect
	useEffect(() => {
		let cancelled = false;

		const doSearch = async () => {
			if (!articleQuery.trim()) {
				setArticleResults([]);
				setArticleSearched(false);
				return;
			}

			setArticleLoading(true);
			try {
				let res;
				if (!articleFilterType || articleFilterType === 'articles') {
					res = await search(articleQuery, { type: 'articles' }, searchPage);
					if (cancelled) return;
					const newArticles = res.data.articles || [];
					setArticleResults(newArticles);
					setSearchHasMore(newArticles.length >= PER_PAGE);
				} else {
					// stars, recent-read, recent-played
					res = await fetch('GET', '/articles', null, {
						q: articleQuery,
						type: articleFilterType,
						page: searchPage,
						per_page: PER_PAGE,
					});
					if (cancelled) return;
					const newArticles = res.data || [];
					setArticleResults(newArticles);
					setSearchHasMore(newArticles.length >= PER_PAGE);
				}
				setArticleSearched(true);
			} catch (err) {
				if (!cancelled) {
					console.error(err);
				}
			} finally {
				if (!cancelled) {
					setArticleLoading(false);
				}
			}
		};

		const timer = setTimeout(
			() => {
				doSearch();
			},
			searchPage === 1 ? 500 : 0,
		);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [articleQuery, articleFilterType, searchPage]);

	const goToPage = (page) => {
		if (articleLoading) return;
		setSearchPage(page);
		// Scroll to top when changing page
		if (scrollable.current) {
			scrollable.current.scrollTo({ top: 0, behavior: 'smooth' });
		}
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

	// Determine which articles to display
	// Show loading if there's a query but search hasn't completed yet
	const isSearchPending = articleQuery.trim() && !articleSearched;
	const displayArticles = articleSearched ? articleResults : featuredArticles;
	const showLoading = articleLoading || isSearchPending;

	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const q = params.get('q');
		if (q) {
			setArticleQuery(q);
		}
	}, [location.search]);

	return (
		<div className="explore" ref={scrollable} onScroll={onScroll}>
			<PageTitle title={t('Explore')} />

			{/* Tabs navigation */}
			<div className="explore-tabs">
				<Link
					to="/feeds"
					className={classNames('tab', {
						active: location.pathname === '/feeds',
					})}
				>
					{t('Featured Feeds')}
				</Link>
				<Link
					to="/articles"
					className={classNames('tab', {
						active: location.pathname === '/articles',
					})}
				>
					{t('Popular Articles')}
				</Link>
			</div>

			{/* Search bar */}
			<div className="explore-search">
				<div className="search-wrapper">
					<div className="filter-select">
						<Select
							className="select-container"
							classNamePrefix="select"
							placeholder={t('Type')}
							isClearable={false}
							options={articleFilterOptions}
							value={articleFilterOptions.find((o) => o.value === articleFilterType)}
							onChange={(val) => setArticleFilterType(val.value)}
						/>
					</div>
					<div className="search">
						<SearchInput
							type="text"
							placeholder={t('Enter keywords to search articles')}
							value={articleQuery}
							onChange={(val) => setArticleQuery(val)}
						/>
					</div>
				</div>
			</div>

			{showLoading && (
				<div className="loading">
					<Loader />
				</div>
			)}

			{!showLoading && (
				<div className="search-results-content">
					{displayArticles.length === 0 && (
						<div className="no-content">
							{articleSearched ? t('No results found') : t('No articles found')}
						</div>
					)}

					{displayArticles.map((article) => (
						<ArticleItem
							key={article.id}
							article={article}
							to={`/feed/${article.feed.id}/article/${article.id}`}
						/>
					))}

					{/* Pagination for search results only */}
					{articleSearched && (searchPage > 1 || searchHasMore) && (
						<div className="pagination">
							<button
								className="btn btn-page"
								onClick={() => goToPage(searchPage - 1)}
								disabled={searchPage === 1}
								aria-label={t('Previous page')}
							>
								<IconChevronLeft size={18} />
							</button>
							<span className="page-info">{searchPage}</span>
							<button
								className="btn btn-page"
								onClick={() => goToPage(searchPage + 1)}
								disabled={!searchHasMore}
								aria-label={t('Next page')}
							>
								<IconChevronRight size={18} />
							</button>
						</div>
					)}
				</div>
			)}

			<GoToTop hidden={topHidden} onClick={scrollTop} />
		</div>
	);
};

export default Articles;
