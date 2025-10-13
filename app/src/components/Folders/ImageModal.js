import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Upload from '../../components/Avatar/Upload';

import { updateFolder } from '../../api/folder';
import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const ImageModal = ({ isOpen = false, folder = {}, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const [image, setImage] = useState();
	const { handleSubmit } = useForm();

	useEffect(() => {
		setImage(folder.icon);
	}, [folder.icon]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await updateFolder(dispatch, folder.id, { icon: image });
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
					<h1>{t('Custom folder icon')}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="form-group center">
						<Upload borderRadius={2} value={image} onChange={setImage} />
					</div>
					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting}>
							{t('Save')}
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

export default ImageModal;
