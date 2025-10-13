import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { sort } from 'fast-sort';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { decodeHTML } from 'entities';
import { useTranslation } from 'react-i18next';

import { MenuButton } from '../Menu';
import Loader from '../Loader';
import Image from '../Image';
import GoToTop from '../GoToTop';
import TimeAgo from '../TimeAgo';
import PageTitle from '../PageTitle';
import PlayOrPause from './PlayOrPause';
import FollowPopover from './FollowPopover';

import { cleanHTML } from '../../utils/sanitize';
import { getFeed } from '../../api/feed';
import { clearArticles, getArticles } from '../../api/article';
import { followFeed } from '../../api/follow';

const FeedDetail = () => {
	const source = useRef();
	const scrollable = useRef();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const { libraryId } = useParams();
	const follows = useSelector((state) => state.follows || {});
	const articles = useSelector((state) =>
		sort(Object.values(state.articles || {})).desc((a) => a.orderedAt),
	);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [feed, setFeed] = useState();
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [topHidden, setTopHidden] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				if (source && source.current) {
					source.current.cancel();
				}
				if (libraryId) {
					setLoading(true);
					const feed = await getFeed(libraryId);
					setFeed(feed.data);

					source.current = axios.CancelToken.source();
					await getArticles(
						dispatch,
						{ per_page: 50, feedId: libraryId },
						source.current.token,
					);
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
			clearArticles(dispatch);
		};
	}, [dispatch, libraryId]);

	const openMenu = async (anchorRef, skipClick, followed) => {
		if (!followed) {
			setSubmitting(true);
			await followFeed(dispatch, feed.id);
			setSubmitting(false);
		}
		if (!submitting) {
			setAnchorRef(anchorRef);
			setSkipClick(skipClick);
			setMenuIsOpen(true);
		}
	};

	const closeMenu = () => {
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
		<div className="sources" ref={scrollable} onScroll={onScroll}>
			<div className="source-detail">
				{loading && <Loader />}
				{!loading && !feed && <div className="no-content">{t('No content found')}</div>}
				{!loading && feed && (
					<>
						<PageTitle title={feed.title} />
						<div className="source-info">
							<div className="left">
								<h1 className="title">{feed.title}</h1>
							</div>
							<div className="right">
								<MenuButton
									onClick={(anchorRef, skipClick) =>
										openMenu(anchorRef, skipClick, follows[feed.id])
									}
								>
									{follows && !follows[feed.id] ? (
										<button className="btn primary" disabled={submitting}>
											{t('Subscribe')}
										</button>
									) : (
										<button className="btn">{t('Subscribed')}</button>
									)}
								</MenuButton>
							</div>
						</div>
						<div className="source-desc">{cleanHTML(feed.description)}</div>
						<div className="source-articles">
							{articles.length === 0 && (
								<div className="no-content">{t('No articles found')}</div>
							)}
							{articles.map((article) => {
								const playable =
									article.feed.type === 'podcast' && article.type === 'episode';
								const desc = decodeHTML(article.description);
								return (
									<Link
										className="article-item"
										key={article.id}
										to={`/feed/${article.feed.id}/article/${article.id}`}
									>
										<div className="left">
											<div className="icon">
												<Image
													relative={true}
													src={`/images/article/${article.id}?w=120&h=120`}
												/>
												{playable && <PlayOrPause article={article} />}
											</div>
										</div>
										<div className="right">
											<h4 title={article.title}>{article.title}</h4>
											{desc && (
												<div className="desc" title={desc}>
													{desc}
												</div>
											)}
											<div className="meta">
												<TimeAgo className="time" value={article.createdAt} />
												<span className="feed" title={feed.title}>
													{feed.title}
												</span>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</>
				)}
			</div>
			<FollowPopover
				align="end"
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

export default FeedDetail;
