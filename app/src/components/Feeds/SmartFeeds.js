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
	IconCompass,
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
					active: location.pathname === '/' || location.pathname.startsWith('/article/'),
				})}
			>
				<Link to="/" title={t('Primary')}>
					<div className="icon">
						<IconListDetails />
					</div>
					<div className="title">{t('Primary')}</div>
					<div className="count">
						<Total value={totals.primary} />
					</div>
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
					<div className="count">
						<Total value={totals.star} />
					</div>
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
					<div className="count">
						<Total value={totals.recentRead} />
					</div>
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
					<div className="count">
						<Total value={totals.recentPlayed} />
					</div>
				</Link>
			</li>
			<li
				className={classNames({
					active:
						location.pathname.startsWith('/feeds') ||
						location.pathname.startsWith('/articles'),
				})}
			>
				<Link to="/feeds" title={t('Explore')}>
					<div className="icon">
						<IconCompass />
					</div>
					<div className="title">{t('Explore')}</div>
				</Link>
			</li>
		</ul>
	);
};

export default SmartFeeds;
