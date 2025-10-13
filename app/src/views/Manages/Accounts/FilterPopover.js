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
				<MenuItem
					className={classNames({
						active: sortBy === 'activeAt,-1',
					})}
					onClick={() => {
						onChange('activeAt,-1');
					}}
				>
					{t('Active order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'suspended,-1',
					})}
					onClick={() => {
						onChange('suspended,-1');
					}}
				>
					{t('Status order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'followCount,-1',
					})}
					onClick={() => {
						onChange('followCount,-1');
					}}
				>
					{t('Feeds order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'starCount,-1',
					})}
					onClick={() => {
						onChange('starCount,-1');
					}}
				>
					{t('Stars order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'readCount,-1',
					})}
					onClick={() => {
						onChange('readCount,-1');
					}}
				>
					{t('Read order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'playCount,-1',
					})}
					onClick={() => {
						onChange('playCount,-1');
					}}
				>
					{t('Played order')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'folderCount,-1',
					})}
					onClick={() => {
						onChange('folderCount,-1');
					}}
				>
					{t('Folders order')}
				</MenuItem>
			</Menu>
		</>
	);
};

export default FilterPopover;
