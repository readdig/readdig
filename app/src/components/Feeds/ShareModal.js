import React, { useState, useRef } from 'react';
import ReactModal from 'react-modal';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useTranslation } from 'react-i18next';
import { IconX, IconCopy } from '@tabler/icons-react';

import config from '../../config';

const ShareModal = ({ isOpen = false, shareId, closeModal }) => {
	const textInput = useRef();
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const onClose = () => {
		closeModal();
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
					<h1>{t('Share article link')}</h1>
					<span className="exit" onClick={onClose}>
						<IconX />
					</span>
				</header>
				<section>
					<div className="form-group">
						<div className="form-control">
							<input
								type="text"
								ref={textInput}
								readOnly={true}
								value={`${config.product.url}/share/${shareId}`}
							/>
							<CopyToClipboard
								text={`${config.product.url}/share/${shareId}`}
								onCopy={() => setCopied(true)}
							>
								<IconCopy className="clickable" />
							</CopyToClipboard>
						</div>
						{copied && <div className="note">{t('Copied')}</div>}
					</div>
				</section>
			</ReactModal>
		)
	);
};

export default ShareModal;
