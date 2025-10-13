import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { mergeFeed } from '../../../api/feed';
import FeedSelect from './FeedSelect';

import { ReactComponent as ExitIcon } from '../../../images/icons/close.svg';

const MergeModal = ({ isOpen = false, feed = {}, closeModal }) => {
	const { t } = useTranslation();
	const [feedId, setFeedId] = useState();
	const [submitting, setSubmitting] = useState(false);
	const { handleSubmit } = useForm();

	const onClose = () => {
		toast.dismiss();
		setFeedId();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		if (!feedId) {
			return;
		}

		try {
			toast.dismiss();
			setSubmitting(true);
			await mergeFeed(feed.id, feedId);
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
					<h1>{t('Merge to {{feedName}}', { feedName: feed.title })}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="form-group">
						<FeedSelect
							placeholder={t('Search feeds')}
							feedId={feed.id}
							onChange={setFeedId}
						/>
						<div className="note">{t('Select feed to be merged')}</div>
					</div>

					<div className="buttons">
						<button className="btn primary" disabled={submitting} type="submit">
							{t('Merge')}
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

export default MergeModal;
