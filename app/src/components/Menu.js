import React, { useEffect, useRef } from 'react';
import {
	ControlledMenu,
	MenuItem as menuItem,
	MenuDivider as menuDivider,
	FocusableItem as focusableItem,
	MenuGroup as menuGroup,
} from '@szhsin/react-menu';

export const MenuGroup = menuGroup;
export const MenuItem = menuItem;
export const MenuDivider = menuDivider;
export const FocusableItem = focusableItem;

export const MenuButton = ({ children, onClick }) => {
	const anchorRef = useRef();
	const skipClick = useRef(false);

	return React.cloneElement(children, {
		ref: anchorRef,
		onClick: (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (!skipClick.current) {
				if (onClick) {
					onClick(anchorRef, skipClick);
				}
			}
		},
	});
};

export const Menu = ({
	arrow = true,
	portal = false,
	transition = true,
	align = 'center',
	direction = 'left',
	viewScroll = true,
	boundingBoxPadding = '10 8',
	isOpen = false,
	anchorRef = {},
	skipClick = {},
	children,
	className,
	onClose,
}) => {
	useEffect(() => {
		if (!isOpen || !viewScroll) return;

		const onScroll = () => {
			onClose && onClose();
		};

		window.addEventListener('scroll', onScroll, true);
		return () => window.removeEventListener('scroll', onScroll, true);
	}, [isOpen, viewScroll, onClose]);

	return (
		<ControlledMenu
			viewScroll={viewScroll ? 'close' : 'auto'}
			arrow={arrow}
			portal={portal}
			transition={transition}
			state={isOpen ? 'open' : 'closed'}
			align={align}
			direction={direction}
			anchorRef={anchorRef}
			className={className}
			boundingBoxPadding={boundingBoxPadding}
			onClose={({ reason }) => {
				if (reason === 'blur') {
					skipClick.current = true;
					setTimeout(() => (skipClick.current = false), 300);
				}
				onClose && onClose();
			}}
		>
			{children}
		</ControlledMenu>
	);
};
