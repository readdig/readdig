import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import UpdateModal from './UpdateModal';
import DeleteModal from './DeleteModal';
import MergeModal from './MergeModal';
import { Menu, MenuItem } from '../../../components/Menu';
import { updateFeed } from '../../../api/feed';

const ActionPopover = ({
	feed = {},
	isOpen = false,
	anchorRef = {},
	skipClick = {},
	onClose,
	onEnd,
}) => {
	const { t } = useTranslation();
	const [modal, setModal] = useState({});

	const openModal = (key) => {
		setModal({ [key]: true });
	};

	const closeModal = () => {
		setModal({});
	};

	const resetFeed = async (feedId, data) => {
		toast.dismiss();
		await updateFeed(feedId, data);
		onEnd && onEnd();
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
				{feed.featured ? (
					<MenuItem onClick={() => resetFeed(feed.id, { featured: false })}>
						{t('Remove featured')}
					</MenuItem>
				) : (
					<MenuItem onClick={() => resetFeed(feed.id, { featured: true })}>
						{t('Set as featured')}
					</MenuItem>
				)}
				{feed.fullText ? (
					<MenuItem onClick={() => resetFeed(feed.id, { fullText: false })}>
						{t('Close full text')}
					</MenuItem>
				) : (
					<MenuItem onClick={() => resetFeed(feed.id, { fullText: true })}>
						{t('Open full text')}
					</MenuItem>
				)}
				{feed.consecutiveScrapeFailures > 0 && (
					<MenuItem onClick={() => resetFeed(feed.id, { consecutiveScrapeFailures: 0 })}>
						{t('Reset failure')}
					</MenuItem>
				)}
				<MenuItem onClick={() => openModal('updateModalIsOpen')}>{t('Edit')}</MenuItem>
				{!feed.duplicateOf && (
					<MenuItem onClick={() => openModal('mergeModalIsOpen')}>{t('Merge')}</MenuItem>
				)}
				<MenuItem onClick={() => openModal('deleteModalIsOpen')}>{t('Delete')}</MenuItem>
			</Menu>
			<UpdateModal
				feed={feed}
				isOpen={modal.updateModalIsOpen}
				onEnd={onEnd}
				closeModal={closeModal}
			/>
			<DeleteModal
				feed={feed}
				isOpen={modal.deleteModalIsOpen}
				onEnd={onEnd}
				closeModal={closeModal}
			/>
			<MergeModal
				feed={feed}
				isOpen={modal.mergeModalIsOpen}
				onEnd={onEnd}
				closeModal={closeModal}
			/>
		</>
	);
};

export default ActionPopover;
