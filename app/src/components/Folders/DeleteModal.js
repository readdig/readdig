import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deleteFolder } from '../../api/folder';

const DeleteModal = ({ isOpen = false, feeds = [], folders = [], closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit } = useForm();

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const folderIds = folders.map((f) => f.id);
			const feedIds = feeds.map((f) => f.id);
			await deleteFolder(dispatch, data.unfollow, folderIds, feedIds);
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
					<h1>{t('Delete folder')}</h1>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<p>
						{t('Are you sure you want to delete the {{folderName}} folders?', {
							folderName:
								folders && folders.length === 1
									? folders[0].name
									: t('selected {{folderNubmer}}', { folderNubmer: folders.length }),
						})}
					</p>
					<div className="form-group checkbox">
						<label>
							<input type="checkbox" name="unfollow" ref={register} />
							<span>{t('Delete feeds in folder')}</span>
						</label>
					</div>
					<div className="buttons">
						<button type="submit" className="btn delete" disabled={submitting}>
							{t('Delete')}
						</button>
						<button type="button" className="btn link cancel" onClick={onClose}>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</ReactModal>
		)
	);
};

DeleteModal.defaultProps = {
	isOpen: false,
	folders: [],
	feeds: [],
};

export default DeleteModal;
