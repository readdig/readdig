import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useTranslation } from 'react-i18next';

import { MenuButton } from '../Menu';
import Loader from '../Loader';
import Image from '../Image';
import GoToTop from '../GoToTop';
import PageTitle from '../PageTitle';
import FeedTypeSelect from './FeedTypeSelect';
import CategoryList from '../Categories/CategoryList';
import SearchInput from '../SearchInput';
import FollowPopover from './FollowPopover';
import FeedLike from './FeedLike';

import { cleanHTML } from '../../utils/sanitize';
import { getFeatured } from '../../api/feed';
import { followFeed } from '../../api/follow';

const FeedList = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const pager = useMemo(() => ({ page: 1, per_page: 50 }), []);
	const feeds = useSelector((state) => state.feeds || []);
	const follows = useSelector((state) => state.follows || {});
	const reachedEndOfFeeds = useSelector((state) => state.reachedEndOfFeeds || false);
	const [hasMore, setHasMore] = useState(true);
	const [submitting, setSubmitting] = useState({});
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [filters, setFilters] = useState(pager);
	const [feed, setFeed] = useState();
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [topHidden, setTopHidden] = useState(true);

	const clearFeeds = useCallback(() => {
		dispatch({ type: 'CLEAR_FEEDS' });
	}, [dispatch]);

	const getFeeds = useCallback(
		async (params) => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				source.current = axios.CancelToken.source();
				const query = {
					...params,
				};
				await getFeatured(dispatch, query, source.current.token);
			} catch (err) {
				setHasMore(false);
			}
		},
		[dispatch],
	);

	useEffect(() => {
		getFeeds(pager);

		return () => {
			if (source && source.current) {
				source.current.cancel();
			}
			clearFeeds();
		};
	}, [pager, getFeeds, clearFeeds]);

	useEffect(() => {
		if (feeds.length >= 1000 || reachedEndOfFeeds) {
			setHasMore(false);
		}

		return () => {
			setHasMore(true);
		};
	}, [feeds.length, reachedEndOfFeeds]);

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

	return (
		<div className="sources" ref={scrollable}>
			<PageTitle title={t('Library')} />
			<div className="filters col">
				<div className="search">
					<SearchInput
						type="text"
						placeholder={t('Keywords and URL')}
						value={decodeURIComponent(filters.q || '')}
						onChange={(value) => {
							clearFeeds();
							const params = {
								...filters,
								page: 1,
								q: encodeURIComponent(value || ''),
							};
							setFilters(params);
							getFeeds(params);
						}}
					/>
				</div>
				<div className="filter-field">
					<div className="select">
						<FeedTypeSelect
							value={filters.type}
							placeholder={t('Type')}
							onChange={(value) => {
								clearFeeds();
								const params = {
									...filters,
									page: 1,
									type: value,
								};
								setFilters(params);
								getFeeds(params);
							}}
						/>
					</div>
				</div>
			</div>
			<CategoryList
				value={filters.categoryId}
				onChange={(value) => {
					clearFeeds();
					const params = {
						...filters,
						page: 1,
						categoryId: value,
					};
					setFilters(params);
					getFeeds(params);
				}}
			/>
			<InfiniteScroll
				key={scrollable.current}
				scrollableTarget={scrollable.current}
				dataLength={feeds.length}
				onScroll={onScroll}
				next={() => {
					const params = { ...filters, page: (filters.page || 1) + 1 };
					setFilters(params);
					getFeeds(params);
				}}
				hasMore={reachedEndOfFeeds ? false : hasMore}
				loader={
					<div className="end-loader">
						<Loader />
					</div>
				}
				endMessage={
					<div className="end">
						<p>{t('No more feeds')}</p>
					</div>
				}
			>
				<div className="source-list">
					{feeds.map((feed) => {
						const desc = cleanHTML(feed.description);
						return (
							<div className="source-item" key={feed.id}>
								<div className="left">
									<Link className="icon" to={`/library/${feed.id}`}>
										<Image relative={true} src={`/images/feed/${feed.id}?w=120&h=120`} />
									</Link>
								</div>
								<div className="right">
									<h3 className="title" title={feed.title}>
										<Link to={`/library/${feed.id}`}>{feed.title}</Link>
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
				</div>
			</InfiniteScroll>
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

export default FeedList;
