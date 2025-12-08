import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Menu, MenuItem, MenuDivider } from './Menu';
import AddFeedModal from './Feeds/AddFeedModal';
import AddOPMLModal from './Feeds/AddOPMLModal';
import UnfollowModal from './Feeds/UnfollowModal';
import RemoveModal from './Feeds/RemoveModal';
import FeedToFolderModal from './Feeds/FeedToFolderModal';
import DeleteModal from './Folders/DeleteModal';
import NewFolderModal from './Folders/NewFolderModal';
import { clearUnread } from '../api/unread';

const CollectionPopover = ({
	isOpen = false,
	anchorRef = {},
	skipClick = {},
	align = 'center',
	direction = 'bottom',
	onClose,
}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [modal, setModal] = useState({});
	const feeds = useSelector((state) =>
		Object.values(state.follows || {}).filter((f) => f.checked),
	);
	const folders = useSelector((state) =>
		Object.values(state.folders || {}).filter((f) => f.checked),
	);

	const folderIds = folders.map((f) => f.id);
	const folderFeeds = feeds.filter((f) => folderIds.includes(f.folderId));
	const noFolderFeeds = feeds.filter((f) => !folderIds.includes(f.folderId));

	const openModal = (key) => {
		setModal({ [key]: true });
	};

	const closeModal = () => {
		setModal({});
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
		<>
			<Menu
				align={align}
				direction={direction}
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={onClose}
			>
				<>
					{folders.length > 0 && noFolderFeeds.length === 0 && (
						<>
							<MenuItem onClick={() => openModal('deleteModalIsOpen')}>
								{t('Delete folders')}
							</MenuItem>
							<MenuItem onClick={() => openModal('removeModalIsOpen')}>
								{t('Remove feeds')}
							</MenuItem>
						</>
					)}
					{(folders.length > 0 || feeds.length > 0) && (
						<>
							<MenuItem onClick={() => clear()}>{t('Clear unread')}</MenuItem>
							<MenuItem onClick={() => openModal('moveModalIsOpen')}>
								{t('Move feeds')}
							</MenuItem>
							<MenuItem onClick={() => openModal('unfollowModalIsOpen')}>
								{t('Unsubscribe')}
							</MenuItem>
							<MenuDivider />
						</>
					)}
					<MenuItem onClick={() => openModal('newFeedModalIsOpen')}>
						{t('Add feed')}
					</MenuItem>
					<MenuItem onClick={() => openModal('addOPMLModalIsOpen')}>
						{t('Import OPML')}
					</MenuItem>
					<MenuItem onClick={() => openModal('newFolderModalIsOpen')}>
						{t('New folder')}
					</MenuItem>
				</>
			</Menu>
			<AddFeedModal
				isRedirect={false}
				isOpen={modal.newFeedModalIsOpen}
				closeModal={closeModal}
			/>
			<AddOPMLModal isOpen={modal.addOPMLModalIsOpen} closeModal={closeModal} />
			<NewFolderModal
				isRedirect={false}
				isOpen={modal.newFolderModalIsOpen}
				closeModal={closeModal}
			/>
			<UnfollowModal
				feeds={feeds}
				isOpen={modal.unfollowModalIsOpen}
				closeModal={closeModal}
			/>
			<FeedToFolderModal
				feeds={feeds}
				folder={folders[0]}
				isOpen={modal.moveModalIsOpen}
				closeModal={closeModal}
			/>
			<RemoveModal
				feeds={feeds}
				isOpen={modal.removeModalIsOpen}
				closeModal={closeModal}
			/>
			<DeleteModal
				feeds={folderFeeds}
				folders={folders}
				isOpen={modal.deleteModalIsOpen}
				closeModal={closeModal}
			/>
		</>
	);
};

export default CollectionPopover;
