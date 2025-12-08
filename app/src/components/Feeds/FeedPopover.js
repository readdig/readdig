import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import AliasModal from './AliasModal';
import FollowModal from './FollowModal';
import UnfollowModal from './UnfollowModal';
import RemoveModal from './RemoveModal';
import FeedToFolderModal from './FeedToFolderModal';
import { Menu, MenuItem } from '../Menu';
import { primaryFeed, fullTextFeed } from '../../api/follow';
import { clearUnread } from '../../api/unread';

const FeedPopover = ({
	align = 'center',
	direction = 'left',
	isOpen = false,
	anchorRef = {},
	skipClick = {},
	feed = {},
	folder,
	onClose,
}) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const follows = useSelector((state) => state.follows || {});
	const [modal, setModal] = useState({});

	const openModal = (key) => {
		setModal({ [key]: true });
	};

	const closeModal = () => {
		setModal({});
	};

	const primary = async (feedId, primary) => {
		toast.dismiss();
		await primaryFeed(dispatch, feedId, primary);
	};

	const fullText = async (feedId, fullText) => {
		toast.dismiss();
		await fullTextFeed(dispatch, feedId, fullText);
	};

	const clear = async (feedId) => {
		toast.dismiss();
		try {
			await toast.promise(
				async () => {
					await clearUnread(dispatch, { feedIds: [feedId] });
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
				{follows[feed.id] ? (
					[
						follows[feed.id].primary ? (
							<MenuItem key="secondary" onClick={() => primary(feed.id, false)}>
								{t('Set as secondary')}
							</MenuItem>
						) : (
							<MenuItem key="primary" onClick={() => primary(feed.id, true)}>
								{t('Set as primary')}
							</MenuItem>
						),
						follows[feed.id].fullText ? (
							<MenuItem key="cancel-fulltext" onClick={() => fullText(feed.id, false)}>
								{t('Cancel full text')}
							</MenuItem>
						) : (
							<MenuItem key="open-fulltext" onClick={() => fullText(feed.id, true)}>
								{t('Auto full text')}
							</MenuItem>
						),
						<MenuItem key="unread" onClick={() => clear(feed.id)}>
							{t('Clear unread')}
						</MenuItem>,
						<MenuItem
							key="unfollowModalIsOpen"
							onClick={() => openModal('unfollowModalIsOpen')}
						>
							{t('Unsubscribe')}
						</MenuItem>,
						<MenuItem
							key="aliasModalIsOpen"
							onClick={() => openModal('aliasModalIsOpen')}
						>
							{t('Rename')}
						</MenuItem>,
						<MenuItem key="moveModalIsOpen" onClick={() => openModal('moveModalIsOpen')}>
							{t('Move')}
						</MenuItem>,
						folder && (
							<MenuItem
								key="removeModalIsOpen"
								onClick={() => openModal('removeModalIsOpen')}
							>
								{t('Remove')}
							</MenuItem>
						),
					]
				) : (
					<MenuItem
						key="followModalIsOpen"
						onClick={() => openModal('followModalIsOpen')}
					>
						{t('Resubscribe')}
					</MenuItem>
				)}
			</Menu>
			<AliasModal feed={feed} isOpen={modal.aliasModalIsOpen} closeModal={closeModal} />
			<FollowModal feed={feed} isOpen={modal.followModalIsOpen} closeModal={closeModal} />
			<UnfollowModal
				feeds={[feed]}
				isOpen={modal.unfollowModalIsOpen}
				closeModal={closeModal}
			/>
			<FeedToFolderModal
				feeds={[feed]}
				folder={folder}
				isOpen={modal.moveModalIsOpen}
				closeModal={closeModal}
			/>
			<RemoveModal
				feeds={[feed]}
				isOpen={modal.removeModalIsOpen}
				closeModal={closeModal}
			/>
		</>
	);
};

export default FeedPopover;
