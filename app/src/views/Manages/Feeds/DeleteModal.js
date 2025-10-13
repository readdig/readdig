import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deleteFeed } from '../../../api/feed';

const DeleteModal = ({ isOpen = false, feed = {}, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await deleteFeed(feed.id);
			onClose();
			onEnd && onEnd();
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
				shouldCloseOnOverlayClick={false}
			>
				<header>
					<h1>{t('Delete feed')}</h1>
				</header>
				<section>
					<p>
						{t(
							'If you delete a feed, all related data will be deleted, please confirm whether to delete it.',
						)}
					</p>
					<div className="buttons">
						<button
							type="button"
							className="btn delete"
							disabled={submitting}
							onClick={onSubmit}
						>
							{t('Confirm')}
						</button>
						<button type="button" className="btn link cancel" onClick={onClose}>
							{t('Cancel')}
						</button>
					</div>
				</section>
			</ReactModal>
		)
	);
};

export default DeleteModal;
