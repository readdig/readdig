import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IconPlus, IconPencil, IconX } from '@tabler/icons-react';

import { Menu, MenuItem, MenuDivider, FocusableItem } from '../Menu';
import SearchInput from '../SearchInput';
import RenameModal from '../Folders/RenameModal';
import DeleteModal from '../Folders/DeleteModal';
import { followFolder, unfollowFeed } from '../../api/follow';
import { getFolders, newFolder } from '../../api/folder';
import { getCollections } from '../../api/collection';

const FollowPopover = ({
	isOpen = false,
	feed = {},
	anchorRef = {},
	skipClick = {},
	align = 'center',
	closeMenu,
}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const follows = useSelector((state) => state.follows || {});
	const [name, setName] = useState('');
	const [folder, setFolder] = useState();
	const [folders, setFolders] = useState([]);
	const [modalIsOpen, setModalIsOpen] = useState();
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (isOpen && feed.id) {
				const res = await getFolders({
					name,
					feedId: feed.id,
					page: 1,
					per_page: 5,
				});
				setFolders(res.data);
			} else {
				setFolders([]);
			}
		};
		fetchData();
	}, [name, isOpen, feed.id]);

	const onSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			toast.dismiss();
			setSubmitting(true);
			await newFolder(dispatch, { name });
			await getCollections(dispatch);
			setSubmitting(false);
			setName('');
		} catch (err) {
			setSubmitting(false);
		}
	};

	const toggleFolder = async (checked, folderId) => {
		if (checked) {
			await followFolder(dispatch, [feed.id], folderId);
		} else {
			await followFolder(dispatch, [feed.id]);
		}
	};

	const onUnfollow = async () => {
		toast.dismiss();
		closeMenu();
		await unfollowFeed(dispatch, [feed.id]);
	};

	const onClose = () => {
		setName('');
		closeMenu();
	};

	const openModal = (e, modal, folder) => {
		e.preventDefault();
		e.stopPropagation();
		setFolder(folder);
		setModalIsOpen(modal);
	};

	const closeModal = () => {
		setModalIsOpen();
		setFolder();
	};

	return (
		<>
			<Menu
				arrow={true}
				align={align}
				transition={true}
				direction="bottom"
				className="menu-small"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={onClose}
			>
				<>
					<FocusableItem style={{ justifyContent: 'center' }}>
						{({ ref }) => (
							<div className="btn" onClick={onUnfollow}>
								{t('Unsubscribe')}
							</div>
						)}
					</FocusableItem>
					<MenuDivider />
				</>
				<FocusableItem style={{ justifyContent: 'center' }}>
					{({ ref }) => (
						<form className="add-input" onSubmit={onSubmit}>
							<SearchInput
								inputRef={ref}
								type="text"
								placeholder={t('Name')}
								value={name}
								onChange={setName}
							/>
							<button
								type="submit"
								className="btn"
								title={t('New folder')}
								disabled={
									!name ||
									(folders.length > 0 && folders.find((f) => f.name === name)) ||
									submitting
								}
							>
								<IconPlus />
							</button>
						</form>
					)}
				</FocusableItem>
				{folders.length > 0 && (
					<>
						<MenuDivider />
						{folders.map((item) => (
							<MenuItem
								type="checkbox"
								key={item.id}
								title={item.name}
								checked={follows[feed.id] && follows[feed.id].folderId === item.id}
								onClick={(e) => toggleFolder(e.checked, item.id)}
							>
								<div className="name">{item.name}</div>
								<div className="action">
									<i
										className="icon"
										title={t('Rename')}
										onClick={(e) => openModal(e, 'rename', item)}
									>
										<IconPencil />
									</i>
									<i
										className="icon"
										title={t('Delete')}
										onClick={(e) => openModal(e, 'delete', item)}
									>
										<IconX />
									</i>
								</div>
							</MenuItem>
						))}
					</>
				)}
			</Menu>
			<RenameModal
				folder={folder}
				isOpen={modalIsOpen === 'rename'}
				closeModal={closeModal}
			/>
			<DeleteModal
				folders={[folder]}
				isOpen={modalIsOpen === 'delete'}
				closeModal={closeModal}
			/>
		</>
	);
};

export default FollowPopover;
