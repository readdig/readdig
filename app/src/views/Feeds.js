import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import PageTitle from '../components/PageTitle';
import SearchInput from '../components/SearchInput';
import Image from '../components/Image';
import Loader from '../components/Loader';
import GoToTop from '../components/GoToTop';

import CategoryList from '../components/Categories/CategoryList';
import FollowPopover from '../components/Feeds/FollowPopover';
import FeedLike from '../components/Feeds/FeedLike';
import { MenuButton } from '../components/Menu';

import { cleanHTML } from '../utils/sanitize';
import { getFeaturedFeeds } from '../api/featured';
import { search } from '../api/search';
import { followFeed } from '../api/follow';

const PER_PAGE = 20;

const Feeds = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();

	// Featured feeds state (local state)
	const [featuredFeeds, setFeaturedFeeds] = useState([]);
	const follows = useSelector((state) => state.follows || {});

	// Search state
	const [feedQuery, setFeedQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [searching, setSearching] = useState(false);
	const [searched, setSearched] = useState(false);

	// Pagination state for search
	const [searchPage, setSearchPage] = useState(1);
	const [searchHasMore, setSearchHasMore] = useState(false);

	// UI state
	const [submitting, setSubmitting] = useState({});
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [feed, setFeed] = useState();
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [topHidden, setTopHidden] = useState(true);
	const [loading, setLoading] = useState(false);
	const [categoryId, setCategoryId] = useState();

	// Load featured feeds on mount
	const loadFeaturedFeeds = useCallback(async (catId) => {
		try {
			if (source && source.current) {
				source.current.cancel();
			}
			source.current = axios.CancelToken.source();
			setLoading(true);
			const params = { page: 1, per_page: 50 };
			if (catId) {
				params.categoryId = catId;
			}
			const res = await getFeaturedFeeds(params, source.current.token);
			setFeaturedFeeds(res.data || []);
		} catch (err) {
			if (!axios.isCancel(err)) {
				console.error(err);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!feedQuery.trim()) {
			loadFeaturedFeeds(categoryId);
		}

		return () => {
			if (source && source.current) {
				source.current.cancel();
			}
		};
	}, [categoryId, feedQuery, loadFeaturedFeeds]);

	// Reset search when query changes
	useEffect(() => {
		setSearchPage(1);
		setSearchResults([]);
		setSearchHasMore(false);
		// Always reset searched state when query changes to avoid showing "No results" flash
		setSearched(false);
	}, [feedQuery]);

	// Search effect
	useEffect(() => {
		let cancelled = false;

		const doSearch = async () => {
			if (!feedQuery.trim()) {
				setSearchResults([]);
				setSearched(false);
				return;
			}

			setSearching(true);
			try {
				const res = await search(feedQuery, { type: 'feeds', categoryId }, searchPage);
				if (cancelled) return;
				const newFeeds = res.data.feeds || [];
				setSearchResults(newFeeds);
				setSearchHasMore(newFeeds.length >= PER_PAGE);
				setSearched(true);
			} catch (err) {
				if (!cancelled) {
					console.error(err);
				}
			} finally {
				if (!cancelled) {
					setSearching(false);
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
	}, [feedQuery, searchPage, categoryId]);

	const goToPage = (page) => {
		if (searching) return;
		setSearchPage(page);
		if (scrollable.current) {
			scrollable.current.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const openMenu = async (anchorRef, skipClick, feed, followed) => {
		if (!followed) {
			setSubmitting({ ...submitting, [feed.id]: true });
			await followFeed(dispatch, feed.id);
			setSubmitting({ ...submitting, [feed.id]: false });
		}
		if (!submitting[feed.id]) {
			setFeed(feed);
			setAnchorRef(anchorRef);
			setSkipClick(skipClick);
			setMenuIsOpen(true);
		}
	};

	const closeMenu = () => {
		setFeed();
		setMenuIsOpen(false);
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

	const location = useLocation();

	// Determine which feeds to display
	// Show loading if there's a query but search hasn't completed yet
	const isSearchPending = feedQuery.trim() && !searched;
	const displayFeeds = searched ? searchResults : featuredFeeds;
	const isLoading = loading || searching || isSearchPending;

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
					<div className="search">
						<SearchInput
							type="text"
							placeholder={t('Enter keywords or URL to search feeds')}
							value={feedQuery}
							onChange={(value) => setFeedQuery(value)}
						/>
					</div>
				</div>
			</div>

			{/* Category list */}
			<CategoryList
				value={categoryId}
				onChange={(value) => {
					setCategoryId(value);
				}}
			/>

			{isLoading && (
				<div className="loading">
					<Loader />
				</div>
			)}

			{!isLoading && (
				<div className="source-list">
					{displayFeeds.length === 0 && (
						<div className="no-content">
							{searched ? t('No results found') : t('No feeds found')}
						</div>
					)}

					{displayFeeds.map((feed) => {
						const desc = cleanHTML(feed.description);
						return (
							<div className="source-item" key={feed.id}>
								<div className="left">
									<Link className="icon" to={`/feed/${feed.id}`}>
										<Image relative={true} src={`/images/feed/${feed.id}?w=120&h=120`} />
									</Link>
								</div>
								<div className="right">
									<h3 className="title" title={feed.title}>
										<Link to={`/feed/${feed.id}`}>{feed.title}</Link>
									</h3>
									{desc && <div className="desc">{desc}</div>}
									<div className="action">
										<MenuButton
											onClick={(anchorRef, skipClick) =>
												openMenu(anchorRef, skipClick, feed, follows[feed.id])
											}
										>
											{!follows[feed.id] ? (
												<button className="btn primary" disabled={submitting[feed.id]}>
													{t('Subscribe')}
												</button>
											) : (
												<button className="btn">{t('Subscribed')}</button>
											)}
										</MenuButton>
										<FeedLike feed={feed} />
									</div>
								</div>
							</div>
						);
					})}

					{/* Pagination for search results only */}
					{searched && (searchPage > 1 || searchHasMore) && (
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

			<FollowPopover
				feed={feed}
				isOpen={menuIsOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				closeMenu={closeMenu}
			/>

			<GoToTop hidden={topHidden} onClick={scrollTop} />
		</div>
	);
};

export default Feeds;
