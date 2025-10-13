import React from 'react';

import { MenuButton } from './Menu';
import { ReactComponent as Icon } from '../images/icons/filter.svg';

const FilterIcon = ({ onClick }) => {
	return (
		<MenuButton onClick={onClick}>
			<div className="btn last">
				<Icon />
			</div>
		</MenuButton>
	);
};

export default FilterIcon;
