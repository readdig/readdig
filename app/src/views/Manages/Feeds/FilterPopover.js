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
					{t('Recent created')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'createdAt,1',
					})}
					onClick={() => {
						onChange('createdAt,1');
					}}
				>
					{t('Oldest created')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'lastScraped,-1',
					})}
					onClick={() => {
						onChange('lastScraped,-1');
					}}
				>
					{t('Recent updated')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'lastScraped,1',
					})}
					onClick={() => {
						onChange('lastScraped,1');
					}}
				>
					{t('Oldest updated')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'consecutiveScrapeFailures,-1',
					})}
					onClick={() => {
						onChange('consecutiveScrapeFailures,-1');
					}}
				>
					{t('Most failures')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'valid,1',
					})}
					onClick={() => {
						onChange('valid,1');
					}}
				>
					{t('Valid status')}
				</MenuItem>
				<MenuItem
					className={classNames({
						active: sortBy === 'duplicateOf,-1',
					})}
					onClick={() => {
						onChange('duplicateOf,-1');
					}}
				>
					{t('Duplicate feed')}
				</MenuItem>
			</Menu>
		</>
	);
};

export default FilterPopover;
