import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';

import FeedSelect from '../Feeds/FeedSelect';
import { followFolder } from '../../api/follow';

const AddFeedModal = ({ isOpen = false, folder = {}, closeModal }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const [feeds, setFeeds] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const { handleSubmit } = useForm();

	const onClose = () => {
		toast.dismiss();
		setFeeds([]);
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const feedIds = feeds.map((feed) => feed.id);
			const folderId = folder.id;
			await followFolder(dispatch, feedIds, folderId);
			onClose();
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		isOpen && (
			<ReactModal
				ariaHideApp={false}
				className="modal"
				isOpen={true}
				onRequestClose={onClose}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('Add feed to folder')}</h1>
					<span className="exit" onClick={onClose}>
						<IconX />
					</span>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="form-group required">
						<label>
							{t('Feed')}
							<span className="note">({t('multiple selections')})</span>
						</label>
						<FeedSelect placeholder={t('Search feeds')} onChange={setFeeds} />
						<div className="note">{t('Enter a name to search for feeds.')}</div>
					</div>

					<div className="buttons">
						<button
							className="btn primary"
							disabled={submitting || feeds.length === 0}
							type="submit"
						>
							{t('Add')}
						</button>
						<button className="btn link cancel" onClick={onClose} type="button">
							{t('Cancel')}
						</button>
					</div>
				</form>
			</ReactModal>
		)
	);
};

export default AddFeedModal;
