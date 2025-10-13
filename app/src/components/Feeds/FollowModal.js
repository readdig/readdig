import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import FolderSelect from '../../components/Folders/FolderSelect';
import { followFeed } from '../../api/follow';

import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const FollowModal = ({ isOpen = false, feed = {}, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [folder, setFolder] = useState();
	const [submitting, setSubmitting] = useState(false);
	const { handleSubmit } = useForm();

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const folderId = folder ? folder.value : undefined;
			await followFeed(dispatch, feed.id, folderId);
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
					<h1>
						{t('Subscribe')} {feed.title && `${feed.title}`}
					</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="form-group">
						<label>
							{t('Folder')}
							<span className="note">({t('optional')})</span>
						</label>
						<FolderSelect
							placeholder={t('Search folders')}
							value={folder}
							onChange={setFolder}
						/>
						<div className="note">{t('Enter a name to search for folders.')}</div>
					</div>
					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting}>
							{t('Subscribe')}
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

export default FollowModal;
