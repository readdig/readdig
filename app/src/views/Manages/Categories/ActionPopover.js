import React from 'react';
import { useTranslation } from 'react-i18next';

import { Menu, MenuItem } from '../../../components/Menu';

import { IconPencil, IconTrash, IconList } from '@tabler/icons-react';

const ActionPopover = ({
	anchorRef,
	skipClick,
	isOpen,
	category,
	onClose,
	onEdit,
	onDelete,
	onManageFeeds,
}) => {
	const { t } = useTranslation();

	if (!category) return null;

	return (
		<Menu
			align="center"
			direction="left"
			isOpen={isOpen}
			anchorRef={anchorRef}
			skipClick={skipClick}
			onClose={onClose}
		>
			<MenuItem onClick={onEdit}>
				<IconPencil size={16} />
				<span>{t('Edit')}</span>
			</MenuItem>
			<MenuItem onClick={onManageFeeds}>
				<IconList size={16} />
				<span>{t('Manage feeds')}</span>
			</MenuItem>
			<MenuItem onClick={onDelete}>
				<IconTrash size={16} />
				<span>{t('Delete')}</span>
			</MenuItem>
		</Menu>
	);
};

export default ActionPopover;
