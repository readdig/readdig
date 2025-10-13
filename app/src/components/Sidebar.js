import React from 'react';
import { useDispatch } from 'react-redux';
import { useMediaQuery } from 'react-responsive';

import AddFeed from './Feeds/AddFeed';
import FeedPanel from './Feeds/FeedPanel';
import SmartFeeds from './Feeds/SmartFeeds';

const Sidebar = () => {
	const dispatch = useDispatch();
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1023px)' });

	const closeMenu = () => {
		localStorage.setItem('menuIsOpen', true);
		dispatch({
			type: 'UPDATE_MENU_OPEN',
			menuIsOpen: true,
		});
	};

	return (
		<>
			{isTabletOrMobile && <div className="click-catcher" onClick={closeMenu} />}
			<div className="sidebar" onClick={isTabletOrMobile ? closeMenu : undefined}>
				<SmartFeeds />
				<FeedPanel />
				<AddFeed />
			</div>
		</>
	);
};

export default Sidebar;
