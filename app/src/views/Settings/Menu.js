import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { ReactComponent as SettingsIcon } from '../../images/icons/settings-outline.svg';
import { ReactComponent as AccountIcon } from '../../images/icons/account-outline.svg';
import { ReactComponent as HelpIcon } from '../../images/icons/help-circle-outline.svg';

const Menu = () => {
	const { t, i18n } = useTranslation();
	const location = useLocation();
	const pathname = location.pathname;
	const pathhash = location.hash;

	return (
		<>
			<h3>
				<SettingsIcon />
				<span>{t('General')}</span>
			</h3>
			<ul>
				<li
					className={classNames({
						active: pathname === '/settings/preferences',
					})}
				>
					<Link to="/settings/preferences">{t('Preferences')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/themes',
					})}
				>
					<Link to="/settings/themes">{t('Themes')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/feeds',
					})}
				>
					<Link to="/settings/feeds">{t('My Feeds')}</Link>
				</li>
			</ul>
			<h3>
				<AccountIcon />
				<span>{t('Accounts')}</span>
			</h3>
			<ul>
				<li
					className={classNames({
						active: pathname === '/settings/plans',
					})}
				>
					<Link to="/settings/plans">{t('Plans')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/billing',
					})}
				>
					<Link to="/settings/billing">{t('Billing history')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/profile',
					})}
				>
					<Link to="/settings/profile">{t('Profile')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/security',
					})}
				>
					<Link to="/settings/security">{t('Change password')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/history',
					})}
				>
					<Link to="/settings/history">{t('Clear history')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/delete-account',
					})}
				>
					<Link to="/settings/delete-account">{t('Delete account')}</Link>
				</li>
				<li
					className={classNames({
						active: pathname === '/settings/opml',
					})}
				>
					<Link to="/settings/opml">{t('Export OPML')}</Link>
				</li>
			</ul>
			{i18n.language === 'zh-cn' && (
				<>
					<h3>
						<HelpIcon />
						<span>{t('Help')}</span>
					</h3>
					<ul>
						<li
							className={classNames({
								active: pathname === '/settings/helps' && pathhash === '#pwa',
							})}
						>
							<HashLink to="/settings/helps#pwa" smooth>
								{t('Install a PWA')}
							</HashLink>
						</li>
						<li
							className={classNames({
								active: pathname === '/settings/helps' && pathhash === '#feeds',
							})}
						>
							<HashLink to="/settings/helps#feeds" smooth>
								{t('Add feed')}
							</HashLink>
						</li>
						<li
							className={classNames({
								active: pathname === '/settings/helps' && pathhash === '#tips',
							})}
						>
							<HashLink to="/settings/helps#tips" smooth>
								{t('General tips')}
							</HashLink>
						</li>
						<li
							className={classNames({
								active: pathname === '/settings/helps' && pathhash === '#feedbacks',
							})}
						>
							<HashLink to="/settings/helps#feedbacks" smooth>
								{t('Feedbacks')}
							</HashLink>
						</li>
					</ul>
				</>
			)}
		</>
	);
};

export default Menu;
