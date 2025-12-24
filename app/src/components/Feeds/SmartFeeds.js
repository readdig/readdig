import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
	IconListDetails,
	IconStar,
	IconPlaylist,
	IconHistory,
	IconSearch,
	IconRss,
} from '@tabler/icons-react';

import Total from '../Total';
import { getTotals } from '../../api/total';

const SmartFeeds = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const location = useLocation();
	const totals = useSelector((state) => state.totals || {});

	useEffect(() => {
		const fetchData = async () => {
			try {
				await getTotals(dispatch);
			} catch (err) {
				console.error(err);
			}
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
						<IconListDetails />
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
						<IconStar />
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
						<IconHistory />
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
						<IconPlaylist />
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
						<IconSearch />
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
						<IconRss />
					</div>
					<div className="title">{t('Library')}</div>
					<Total value={totals.feed} />
				</Link>
			</li>
		</ul>
	);
};

export default SmartFeeds;
