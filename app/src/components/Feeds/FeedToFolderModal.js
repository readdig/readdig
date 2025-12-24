import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';

import FolderSelect from '../../components/Folders/FolderSelect';
import { followFolder } from '../../api/follow';

const FeedToFolderModal = ({ isOpen = false, feeds = [], folder = {}, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [selected, setSelected] = useState();
	const [submitting, setSubmitting] = useState(false);
	const { handleSubmit } = useForm();

	useEffect(() => {
		if (folder && folder.id && folder.name) {
			setSelected({ value: folder.id, label: folder.name });
		}
	}, [folder]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		if (!selected || !selected.value) {
			return;
		}

		try {
			toast.dismiss();
			setSubmitting(true);
			const feedIds = feeds.map((f) => f.id);
			const folderId = selected.value;
			await followFolder(dispatch, feedIds, folderId);
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
					<h1>{t('Move feed to a new folder')}</h1>
					<span className="exit" onClick={onClose}>
						<IconX />
					</span>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="form-group required">
						<label>{t('Folder')}</label>
						<FolderSelect
							placeholder={t('Search folders')}
							value={selected}
							onChange={setSelected}
						/>
						<div className="note">{t('Enter a name to search for folders.')}</div>
					</div>

					<div className="buttons">
						<button
							type="submit"
							className="btn primary"
							disabled={submitting || !selected}
						>
							{t('Save')}
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

export default FeedToFolderModal;
