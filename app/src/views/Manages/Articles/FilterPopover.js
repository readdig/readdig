import React, { useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import FilterIcon from '../../../components/FilterIcon';
import { Menu, MenuItem } from '../../../components/Menu';

const FilterPopover = ({ sortBy, onChange }) => {
	const { t } = useTranslation();
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
			<FilterIcon onClick={(anchorRef, skipClick) => openMenu(anchorRef, skipClick)} />
			<Menu
				align="end"
				direction="bottom"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={closeMenu}
			>
				<MenuItem
					className={classNames({
						active: sortBy === 'createdAt,-1',
					})}
					onClick={() => {
						onChange('createdAt,-1');
					}}
				>
					{t('Recent date')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'createdAt,1',
					})}
					onClick={() => {
						onChange('createdAt,1');
					}}
				>
					{t('Oldest date')}
				</MenuItem>
			</Menu>
		</>
	);
};

export default FilterPopover;
