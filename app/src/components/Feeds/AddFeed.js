import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import AddFeedModal from './AddFeedModal';
import AddOPMLModal from './AddOPMLModal';
import NewFolderModal from '../Folders/NewFolderModal';
import { Menu, MenuButton, MenuItem } from '../Menu';
import { clearUnread } from '../../api/unread';

import { ReactComponent as ListIcon } from '../../images/icons/list.svg';
import { ReactComponent as RSSIcon } from '../../images/icons/rss-outline.svg';
import { ReactComponent as OPMLIcon } from '../../images/icons/file-up.svg';
import { ReactComponent as FolderIcon } from '../../images/icons/folder-plus.svg';
import { ReactComponent as ClearIcon } from '../../images/icons/brush-cleaning.svg';

const AddFeed = () => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [newFeedModalIsOpen, setNewFeedModalIsOpen] = useState(false);
	const [addOPMLModalIsOpen, setAddOPMLModalIsOpen] = useState(false);
	const [newFolderModalIsOpen, setNewFolderModalIsOpen] = useState(false);

	const feeds = useSelector((state) => Object.values(state.follows || {}));

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

	const clear = async () => {
		toast.dismiss();
		try {
			await toast.promise(
				async () => {
					const feedIds = feeds.map((f) => f.id);
					await clearUnread(dispatch, { feedIds: feedIds });
				},
				{
					pending: t('Cleaning unread articles, please wait.'),
					success: t('Unread articles have been cleared.'),
					error: t('An error occurred, please try again.'),
				},
			);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="add-action">
			<div className="btn-actions">
				<button
					className="btn"
					title={t('Add feed')}
					onClick={() => setNewFeedModalIsOpen(true)}
				>
					<RSSIcon />
				</button>
				<button
					className="btn"
					title={t('Import OPML')}
					onClick={() => setAddOPMLModalIsOpen(true)}
				>
					<OPMLIcon />
				</button>
				<button
					className="btn"
					title={t('New folder')}
					onClick={() => setNewFolderModalIsOpen(true)}
				>
					<FolderIcon />
				</button>
				<button className="btn" title={t('Clear unread')} onClick={clear}>
					<ClearIcon />
				</button>
			</div>
			<MenuButton onClick={openMenu}>
				<button className="btn-menu">
					<ListIcon />
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
				<MenuItem onClick={clear} title={t('Clear unread')}>
					<ClearIcon />
					<span>{t('Clear unread')}</span>
				</MenuItem>
			</Menu>
			<AddFeedModal isOpen={newFeedModalIsOpen} closeModal={closeModal} />
			<AddOPMLModal isOpen={addOPMLModalIsOpen} closeModal={closeModal} />
			<NewFolderModal isOpen={newFolderModalIsOpen} closeModal={closeModal} />
		</div>
	);
};

export default AddFeed;
