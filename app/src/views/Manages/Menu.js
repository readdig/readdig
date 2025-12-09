import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { ReactComponent as WebIcon } from '../../images/icons/web.svg';

const Menu = () => {
	const { t } = useTranslation();
	const location = useLocation();
	const pathname = location.pathname;

	return (
		<>
			<h3>
				<WebIcon />
				<span>{t('Management')}</span>
			</h3>
			<ul>
				<li
					className={classNames({
						active: pathname === '/manages/feeds',
					})}
				>
					<Link to="/manages/feeds">{t('Manage feeds')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/articles',
					})}
				>
					<Link to="/manages/articles">{t('Manage articles')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/accounts',
					})}
				>
					<Link to="/manages/accounts">{t('Manage accounts')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/plans',
					})}
				>
					<Link to="/manages/plans">{t('Manage plans')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/transactions',
					})}
				>
					<Link to="/manages/transactions">{t('Transactions')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/email',
					})}
				>
					<Link to="/manages/email">{t('Mail test')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/totals',
					})}
				>
					<Link to="/manages/totals">{t('Statistics')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/monitoring',
					})}
				>
					<Link to="/manages/monitoring">{t('Monitoring')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/blocklist',
					})}
				>
					<Link to="/manages/blocklist">{t('Blocklist')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/manages/debug',
					})}
				>
					<Link to="/manages/debug">{t('Debug')}</Link>
				</li>
			</ul>
		</>
	);
};

export default Menu;
