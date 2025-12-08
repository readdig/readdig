import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Menu, MenuItem } from '../Menu';
import AddFeedModal from './AddFeedModal';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import ImageModal from './ImageModal';
import { clearUnread } from '../../api/unread';

const FolderPopover = ({
	isOpen = false,
	folder = {},
	anchorRef = {},
	skipClick = {},
	onClose,
}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [modal, setModal] = useState({});

	const openModal = (key) => {
		setModal({ [key]: true });
	};

	const closeModal = () => {
		setModal({});
	};

	const clear = async (folderId) => {
		toast.dismiss();
		try {
			await toast.promise(
				async () => {
					await clearUnread(dispatch, { folderIds: [folderId] });
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
				align="center"
				direction="left"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={onClose}
			>
				<MenuItem onClick={() => openModal('addFeedModalIsOpen')}>
					{t('Add feed')}
				</MenuItem>
				<MenuItem onClick={() => openModal('imageModalIsOpen')}>
					{t('Change icon')}
				</MenuItem>
				<MenuItem key="unread" onClick={() => clear(folder.id)}>
					{t('Clear unread')}
				</MenuItem>
				<MenuItem onClick={() => openModal('renameModalIsOpen')}>{t('Rename')}</MenuItem>
				<MenuItem onClick={() => openModal('deleteModalIsOpen')}>{t('Delete')}</MenuItem>
			</Menu>
			<AddFeedModal
				folder={folder}
				isOpen={modal.addFeedModalIsOpen}
				closeModal={closeModal}
			/>
			<RenameModal
				folder={folder}
				isOpen={modal.renameModalIsOpen}
				closeModal={closeModal}
			/>
			<DeleteModal
				folders={[folder]}
				isOpen={modal.deleteModalIsOpen}
				closeModal={closeModal}
			/>
			<ImageModal
				folder={folder}
				isOpen={modal.imageModalIsOpen}
				closeModal={closeModal}
			/>
		</>
	);
};

export default FolderPopover;
