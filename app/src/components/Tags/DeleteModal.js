import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deleteTag } from '../../api/tag';

const DeleteModal = ({ tag = {}, articleId, isOpen = false, closeModal }) => {
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
			await deleteTag(dispatch, tag.id, articleId);
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
					<h1>{t('Delete tag')}</h1>
				</header>
				<section>
					<p>
						{t('Are you sure you want to delete the tag {{tagName}}?', {
							tagName: tag.name,
						})}
					</p>
					<div className="buttons">
						<button
							type="button"
							className="btn delete"
							disabled={submitting}
							onClick={onSubmit}
						>
							{t('Delete')}
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
