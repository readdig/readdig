import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { renameFeed } from '../../api/follow';

import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const AliasModal = ({ isOpen = false, feed = {}, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, reset } = useForm();

	useEffect(() => {
		reset({
			alias: feed.title,
		});
	}, [feed.title, reset]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			if (data.alias !== feed.title) {
				await renameFeed(dispatch, feed.id, data.alias);
			}
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
					<h1>{t('Rename feed')}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', { error: errors.alias })}>
						<input
							autoComplete="false"
							name="alias"
							type="text"
							ref={register({ maxLength: 255 })}
						/>
						<div className="note">
							{t(
								'Enter a new name, if you need to restore the default name, please clear the save.',
							)}
						</div>
					</div>
					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting}>
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

export default AliasModal;
