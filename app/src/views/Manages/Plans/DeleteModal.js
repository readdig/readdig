import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deletePlan } from '../../../api/plan';

const DeleteModal = ({ isOpen = false, plan = {}, closeModal, onEnd }) => {
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
			await deletePlan(plan.id);
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
					<h1>{t('Delete plan')}</h1>
				</header>

				<section>
					<p>{t('Are you sure to delete {{planName}} plan?', { planName: plan.name })}</p>
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
