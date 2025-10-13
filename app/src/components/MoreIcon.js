import React from 'react';

import { MenuButton } from './Menu';
import { ReactComponent as Icon } from '../images/icons/dots-horizontal-circle-outline.svg';

const MoreIcon = ({ onClick }) => {
	return (
		<MenuButton onClick={onClick}>
			<Icon />
		</MenuButton>
	);
};

export default MoreIcon;
