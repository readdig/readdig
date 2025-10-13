import React from 'react';
import ReactModal from 'react-modal';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ message, isOpen = false, onSubmit, onClose }) => {
	const { t } = useTranslation();

	return (
		isOpen && (
			<ReactModal
				ariaHideApp={false}
				className="modal modal-confirm"
				isOpen={true}
				onRequestClose={onClose}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={false}
			>
				<section>
					<div className="message">{t(message)}</div>
					<div className="buttons">
						<button
							type="button"
							className="btn primary"
							onClick={() => {
								onSubmit();
								onClose();
							}}
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

export default ConfirmModal;
