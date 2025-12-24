import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
	IconLogout,
	IconSettings,
	IconUser,
	IconAdjustments,
	IconRss,
	IconDashboard,
} from '@tabler/icons-react';

import Avatar from './index';
import { Menu, MenuButton, MenuItem } from '../Menu';

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
							<IconDashboard />
							<span>{t('Dashboard')}</span>
						</Link>
					</MenuItem>
				)}
				<MenuItem className="link">
					<a href="/settings/feeds">
						<IconRss />
						<span>{t('My Feeds')}</span>
					</a>
				</MenuItem>
				<MenuItem className="link">
					<a href="/settings/profile">
						<IconUser />
						<span>{t('Profile')}</span>
					</a>
				</MenuItem>
				<MenuItem className="link">
					<Link to="/settings/preferences">
						<IconAdjustments />
						<span>{t('Preferences')}</span>
					</Link>
				</MenuItem>
				<MenuItem className="link">
					<Link to="/settings">
						<IconSettings />
						<span>{t('More...')}</span>
					</Link>
				</MenuItem>
				<MenuItem
					onClick={() => {
						localStorage.removeItem('authedUser');
						window.location = '/';
					}}
				>
					<IconLogout />
					<span>{t('Logout')}</span>
				</MenuItem>
			</Menu>
		</>
	);
};

export default UserAvatar;
