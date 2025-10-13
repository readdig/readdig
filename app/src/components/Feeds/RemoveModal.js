import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { followFolder } from '../../api/follow';

const RemoveModal = ({ isOpen = false, feeds = [], closeModal }) => {
	const dispatch = useDispatch();
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
			const feedIds = feeds.map((f) => f.id);
			await followFolder(dispatch, feedIds);
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
				shouldCloseOnOverlayClick={false}
			>
				<header>
					<h1>{t('Remove feed')}</h1>
				</header>
				<section>
					<p>
						{t(
							'After remove, the content of the feed will no longer be displayed in the folder. Are you sure to remove?',
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

export default RemoveModal;
