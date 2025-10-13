import React from 'react';
import ReactModal from 'react-modal';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PasswordModal = ({ isOpen = false, submitting = false, closeModal, onSubmit }) => {
	const { t } = useTranslation();
	const { register, handleSubmit, errors } = useForm();

	return (
		isOpen && (
			<ReactModal
				className="modal"
				isOpen={true}
				ariaHideApp={false}
				onRequestClose={closeModal}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('Confirm password')}</h1>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div
						className={classNames('form-group', 'required', { error: errors.password })}
					>
						<label>{t('Account password')}</label>
						<input
							type="password"
							name="password"
							ref={register({
								required: true,
							})}
						/>
						<div className="note">
							{t('Please enter the account password to confirm.')}
						</div>
					</div>
					<div className="buttons">
						<button type="submit" className="btn delete" disabled={submitting}>
							{t('Confirm')}
						</button>
						<button type="button" className="btn link cancel" onClick={closeModal}>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</ReactModal>
		)
	);
};

export default PasswordModal;
