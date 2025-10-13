import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Avatar from './index';
import { Menu, MenuButton, MenuItem } from '../Menu';

import { ReactComponent as LogoutIcon } from '../../images/icons/logout-variant.svg';
import { ReactComponent as SettingsIcon } from '../../images/icons/settings-outline.svg';
import { ReactComponent as AccountIcon } from '../../images/icons/account-outline.svg';
import { ReactComponent as TuneIcon } from '../../images/icons/tune-variant.svg';
import { ReactComponent as FeedIcon } from '../../images/icons/rss.svg';
import { ReactComponent as WebIcon } from '../../images/icons/web.svg';

const UserAvatar = () => {
	const { t } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const [isOpen, setIsOpen] = useState(false);
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();

	const openMenu = (anchorRef, skipClick) => {
		setAnchorRef(anchorRef);
		setSkipClick(skipClick);
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	return (
		<>
			<MenuButton onClick={openMenu}>
				<button className="user">
					<Avatar avatarUrl={user.avatar} title={user.name} />
					<span className="username">{user.name}</span>
				</button>
			</MenuButton>
			<Menu
				align="end"
				direction="bottom"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={closeMenu}
			>
				{user.admin && (
					<MenuItem className="link">
						<Link to="/manages">
							<WebIcon />
							<span>{t('Dashboard')}</span>
						</Link>
					</MenuItem>
				)}
				<MenuItem className="link">
					<a href="/settings/feeds">
						<FeedIcon />
						<span>{t('My Feeds')}</span>
					</a>
				</MenuItem>
				<MenuItem className="link">
					<a href="/settings/profile">
						<AccountIcon />
						<span>{t('Profile')}</span>
					</a>
				</MenuItem>
				<MenuItem className="link">
					<Link to="/settings/preferences">
						<TuneIcon />
						<span>{t('Preferences')}</span>
					</Link>
				</MenuItem>
				<MenuItem className="link">
					<Link to="/settings">
						<SettingsIcon />
						<span>{t('More...')}</span>
					</Link>
				</MenuItem>
				<MenuItem
					onClick={() => {
						localStorage.removeItem('authedUser');
						window.location = '/';
					}}
				>
					<LogoutIcon />
					<span>{t('Logout')}</span>
				</MenuItem>
			</Menu>
		</>
	);
};

export default UserAvatar;
