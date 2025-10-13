import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import EditModal from './EditModal';
import DeleteModal from './DeleteModal';
import { Menu, MenuItem } from '../../../components/Menu';

const ActionPopover = ({
	isOpen = false,
	plan = {},
	anchorRef = {},
	skipClick = {},
	onClose,
	onEnd,
}) => {
	const { t } = useTranslation();
	const [modal, setModal] = useState({});

	const openModal = (key) => {
		setModal({ [key]: true });
	};

	const closeModal = () => {
		setModal({});
	};

	return (
		<>
			<Menu
				align="center"
				direction="left"
				isOpen={isOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={onClose}
			>
				<MenuItem onClick={() => openModal('editModalIsOpen')}>{t('Edit')}</MenuItem>
				<MenuItem onClick={() => openModal('deleteModalIsOpen')}>{t('Delete')}</MenuItem>
			</Menu>
			<EditModal
				plan={plan}
				isOpen={modal.editModalIsOpen}
				onEnd={onEnd}
				closeModal={() => closeModal('editModalIsOpen')}
			/>
			<DeleteModal
				plan={plan}
				isOpen={modal.deleteModalIsOpen}
				onEnd={onEnd}
				closeModal={() => closeModal('deleteModalIsOpen')}
			/>
		</>
	);
};

export default ActionPopover;
