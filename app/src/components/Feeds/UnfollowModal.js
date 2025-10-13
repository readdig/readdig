import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { unfollowFeed } from '../../api/follow';

const UnfollowModal = ({ isOpen = false, feeds = [], closeModal }) => {
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
			await unfollowFeed(dispatch, feedIds);
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
					<h1>{t('Unsubscribe')}</h1>
				</header>

				<section>
					<p>
						{t('Are you sure you want to unsubscribe the {{feedName}} feeds?', {
							feedName:
								feeds && feeds.length === 1
									? feeds[0].title
									: t('selected {{feedNubmer}}', { feedNubmer: feeds.length }),
						})}
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

export default UnfollowModal;
