import React from 'react';
import ReactModal from 'react-modal';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../images/icons/check-circle.svg';

const PaySuccess = ({ isOpen = false, closeModal }) => {
	const { t } = useTranslation();

	return (
		isOpen && (
			<ReactModal
				className="modal modal-payment"
				isOpen={true}
				ariaHideApp={false}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={false}
			>
				<section className="success">
					<div className="icon">
						<CheckIcon />
					</div>
					<div className="text">{t('Payment Success!')}</div>
					<div className="small-text">{t('Thank you for subscribing to the plan.')}</div>
					<div className="buttons">
						<button className="btn primary" onClick={closeModal}>
							{t('Done')}
						</button>
					</div>
				</section>
			</ReactModal>
		)
	);
};

export default PaySuccess;
