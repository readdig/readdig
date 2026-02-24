import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';

import FeedPanel from './Feeds/FeedPanel';
import SmartFeeds from './Feeds/SmartFeeds';

const Sidebar = () => {
	const dispatch = useDispatch();
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1023px)' });
	const menuIsOpen = useSelector((state) =>
		state.menuIsOpen === undefined || state.menuIsOpen === null ? true : state.menuIsOpen,
	);

	const touchStartX = useRef(null);
	const touchStartY = useRef(null);

	const closeMenu = useCallback(() => {
		localStorage.setItem('menuIsOpen', true);
		dispatch({
			type: 'UPDATE_MENU_OPEN',
			menuIsOpen: true,
		});
	}, [dispatch]);

	const openMenu = useCallback(() => {
		localStorage.setItem('menuIsOpen', false);
		dispatch({
			type: 'UPDATE_MENU_OPEN',
			menuIsOpen: false,
		});
	}, [dispatch]);

	useEffect(() => {
		if (!isTabletOrMobile) return;

		const SWIPE_THRESHOLD = 50;
		const EDGE_WIDTH = 30;

		const handleTouchStart = (e) => {
			touchStartX.current = e.touches[0].clientX;
			touchStartY.current = e.touches[0].clientY;
		};

		const handleTouchEnd = (e) => {
			if (touchStartX.current === null) return;

			const touchEndX = e.changedTouches[0].clientX;
			const touchEndY = e.changedTouches[0].clientY;
			const deltaX = touchEndX - touchStartX.current;
			const deltaY = touchEndY - touchStartY.current;

			// Only trigger if horizontal swipe is dominant and not in view mode
			const isInViewMode = document.querySelector('.app.view') !== null;
			if (
				Math.abs(deltaX) > Math.abs(deltaY) &&
				Math.abs(deltaX) > SWIPE_THRESHOLD &&
				!isInViewMode
			) {
				if (deltaX > 0 && menuIsOpen && touchStartX.current < EDGE_WIDTH) {
					// Swipe right from left edge to open
					openMenu();
				} else if (deltaX < 0 && !menuIsOpen) {
					// Swipe left to close
					closeMenu();
				}
			}

			touchStartX.current = null;
			touchStartY.current = null;
		};

		document.addEventListener('touchstart', handleTouchStart);
		document.addEventListener('touchend', handleTouchEnd);

		return () => {
			document.removeEventListener('touchstart', handleTouchStart);
			document.removeEventListener('touchend', handleTouchEnd);
		};
	}, [isTabletOrMobile, menuIsOpen, closeMenu, openMenu]);

	return (
		<>
			{isTabletOrMobile && <div className="click-catcher" onClick={closeMenu} />}
			<div className="sidebar" onClick={isTabletOrMobile ? closeMenu : undefined}>
				<SmartFeeds />
				<FeedPanel />
			</div>
		</>
	);
};

export default Sidebar;
