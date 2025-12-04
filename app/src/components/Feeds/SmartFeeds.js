import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Total from '../Total';
import { getTotals } from '../../api/total';

import { ReactComponent as StarIcon } from '../../images/icons/star-outline.svg';
import { ReactComponent as NewsIcon } from '../../images/icons/newspaper-variant-outline.svg';
import { ReactComponent as CircleIcon } from '../../images/icons/record-circle-outline.svg';
import { ReactComponent as PlayCircleIcon } from '../../images/icons/play-circle-outline.svg';
import { ReactComponent as RSSIcon } from '../../images/icons/rss-box.svg';
import { ReactComponent as SearchIcon } from '../../images/icons/magnify.svg';

const SmartFeeds = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const location = useLocation();
	const totals = useSelector((state) => state.totals || {});

	useEffect(() => {
		const fetchData = async () => {
			await getTotals(dispatch);
		};
		fetchData();
	}, [dispatch]);

	return (
		<ul className="menu-list">
			<li
				className={classNames({
					active: location.pathname === '/' || location.pathname.startsWith('/article'),
				})}
			>
				<Link to="/" title={t('Primary')}>
					<div className="icon">
						<NewsIcon />
					</div>
					<div className="title">{t('Primary')}</div>
					<Total value={totals.primary} />
				</Link>
			</li>
			<li
				className={classNames({
					active: location.pathname.startsWith('/stars'),
				})}
			>
				<Link to="/stars" title={t('Stars')}>
					<div className="icon">
						<StarIcon />
					</div>
					<div className="title">{t('Stars')}</div>
					<Total value={totals.star} />
				</Link>
			</li>
			<li
				className={classNames({
					active: location.pathname.startsWith('/recent-read'),
				})}
			>
				<Link to="/recent-read" title={t('Recent Read')}>
					<div className="icon">
						<CircleIcon />
					</div>
					<div className="title">{t('Recent Read')}</div>
					<Total value={totals.recentRead} />
				</Link>
			</li>
			<li
				className={classNames({
					active: location.pathname.startsWith('/recent-played'),
				})}
			>
				<Link to="/recent-played" title={t('Recent Played')}>
					<div className="icon">
						<PlayCircleIcon />
					</div>
					<div className="title">{t('Recent Played')}</div>
					<Total value={totals.recentPlayed} />
				</Link>
			</li>
			<li
				className={classNames({
					active: location.pathname === '/search',
				})}
			>
				<Link to="/search" title={t('Search')}>
					<div className="icon">
						<SearchIcon />
					</div>
					<div className="title">{t('Search')}</div>
				</Link>
			</li>
			<li
				className={classNames({
					active: location.pathname.startsWith('/library'),
				})}
			>
				<Link to="/library" title={t('Library')}>
					<div className="icon">
						<RSSIcon />
					</div>
					<div className="title">{t('Library')}</div>
					<Total value={totals.feed} />
				</Link>
			</li>
		</ul>
	);
};

export default SmartFeeds;
