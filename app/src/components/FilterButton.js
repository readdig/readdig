import React from 'react';
import { IconFilter } from '@tabler/icons-react';

import { MenuButton } from './Menu';

const FilterButton = ({ onClick }) => {
	return (
		<MenuButton onClick={onClick}>
			<div className="btn last">
				<IconFilter />
			</div>
		</MenuButton>
	);
};

export default FilterButton;
