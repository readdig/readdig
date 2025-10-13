import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddFeedModal from './AddFeedModal';
import AddOPMLModal from './AddOPMLModal';
import NewFolderModal from '../Folders/NewFolderModal';
import { Menu, MenuButton, MenuItem } from '../Menu';

import { ReactComponent as PlusIcon } from '../../images/icons/plus-circle.svg';
import { ReactComponent as RSSIcon } from '../../images/icons/rss.svg';
import { ReactComponent as OPMLIcon } from '../../images/icons/file-document-outline.svg';
import { ReactComponent as FolderIcon } from '../../images/icons/folder-outline.svg';

const AddFeed = () => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [newFeedModalIsOpen, setNewFeedModalIsOpen] = useState(false);
	const [addOPMLModalIsOpen, setAddOPMLModalIsOpen] = useState(false);
	const [newFolderModalIsOpen, setNewFolderModalIsOpen] = useState(false);

	const openMenu = (anchorRef, skipClick) => {
		setAnchorRef(anchorRef);
		setSkipClick(skipClick);
		setIsOpen(!isOpen);
	};

	const closeMenu = () => {
		setIsOpen(false);
	};

	const closeModal = () => {
		setNewFeedModalIsOpen(false);
		setAddOPMLModalIsOpen(false);
		setNewFolderModalIsOpen(false);
	};

	return (
		<div className="add-action">
			<MenuButton onClick={openMenu}>
				<button className="icon" title={t('Add')}>
					<PlusIcon />
				</button>
			</MenuButton>
			<Menu
				portal={true}
				align="center"
				direction="top"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={closeMenu}
			>
				<MenuItem onClick={() => setNewFeedModalIsOpen(true)} title={t('Add feed')}>
					<RSSIcon />
					<span>{t('Feed')}</span>
				</MenuItem>
				<MenuItem onClick={() => setAddOPMLModalIsOpen(true)} title={t('Import OPML')}>
					<OPMLIcon />
					<span>{t('OPML')}</span>
				</MenuItem>
				<MenuItem onClick={() => setNewFolderModalIsOpen(true)} title={t('New folder')}>
					<FolderIcon />
					<span>{t('Folder')}</span>
				</MenuItem>
			</Menu>
			<AddFeedModal isOpen={newFeedModalIsOpen} closeModal={closeModal} />
			<AddOPMLModal isOpen={addOPMLModalIsOpen} closeModal={closeModal} />
			<NewFolderModal isOpen={newFolderModalIsOpen} closeModal={closeModal} />
		</div>
	);
};

export default AddFeed;
