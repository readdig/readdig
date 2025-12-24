import React from 'react';
import { IconDots } from '@tabler/icons-react';

import { MenuButton } from './Menu';

const MoreButton = ({ onClick }) => {
	return (
		<MenuButton onClick={onClick}>
			<IconDots />
		</MenuButton>
	);
};

export default MoreButton;
