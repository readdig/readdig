import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import FollowModal from './FollowModal';

const UnfollowToast = ({ feedId, duplicateOf }) => {
	const { t } = useTranslation();
	const follows = useSelector((state) => state.follows);
	const [modalIsOpen, setModalIsOpen] = useState(false);

	const openModal = () => {
		setModalIsOpen(true);
	};

	const closeModal = () => {
		setModalIsOpen(false);
	};

	return (
		<>
			{feedId && follows && !follows[feedId] && !duplicateOf && (
				<div className="toast">
					<span>{t('This feed has not been subscribed, do you need to subscribe?')}</span>
					<button className="btn link text" onClick={openModal}>
						{t('I to subscribe')}
					</button>
				</div>
			)}
			<FollowModal isOpen={modalIsOpen} feed={{ id: feedId }} closeModal={closeModal} />
		</>
	);
};

export default UnfollowToast;
