import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { deleteCategory } from '../../../api/category';

const DeleteModal = ({ category, isOpen, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const handleDelete = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await deleteCategory(category.id);
			toast.success(t('Category deleted'));
			setSubmitting(false);
			onClose();
			onEnd && onEnd();
		} catch (err) {
			setSubmitting(false);
			toast.error(err.response?.data || t('Failed to delete category'));
		}
	};

	if (!isOpen) return null;

	return (
		<ReactModal
			ariaHideApp={false}
			className="modal"
			isOpen={true}
			onRequestClose={onClose}
			overlayClassName="modal-overlay"
			shouldCloseOnOverlayClick={false}
		>
			<header>
				<h1>{t('Delete category')}</h1>
			</header>
			<section>
				<p>
					{t('Are you sure you want to delete "{{name}}"?', {
						name: category?.name,
					})}
				</p>
				<p className="warning">
					{t('This will not delete the feeds, only the category.')}
				</p>
				<div className="buttons">
					<button
						type="button"
						className="btn delete"
						onClick={handleDelete}
						disabled={submitting}
					>
						{submitting ? t('Deleting...') : t('Confirm')}
					</button>
					<button
						type="button"
						className="btn link cancel"
						onClick={onClose}
						disabled={submitting}
					>
						{t('Cancel')}
					</button>
				</div>
			</section>
		</ReactModal>
	);
};

export default DeleteModal;
