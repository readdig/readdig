import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';

import { renameTag } from '../../api/tag';

const RenameModal = ({ tag = {}, isOpen = false, closeModal }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, reset, formState } = useForm({
		mode: 'onChange',
	});

	useEffect(() => {
		reset({
			name: tag.name,
		});
	}, [tag.name, reset]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await renameTag(tag.id, data.name);
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
					<h1>{t('Rename tag')}</h1>
					<span className="exit" onClick={onClose}>
						<IconX />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', 'required', { error: errors.name })}>
						<label>{t('Name')}</label>
						<input
							autoComplete="false"
							name="name"
							type="text"
							ref={register({ required: true })}
						/>
						<div className="note">{t('Enter a tag name.')}</div>
					</div>
					<div className="buttons">
						<button
							type="submit"
							className="btn primary"
							disabled={submitting || !formState.isValid}
						>
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

export default RenameModal;
