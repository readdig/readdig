import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { Menu, MenuItem } from '../../../components/Menu';
import { updateUser } from '../../../api/user';

const ActionPopover = ({
	isOpen = false,
	anchorRef = {},
	skipClick = {},
	user = {},
	onEnd,
	onClose,
}) => {
	const { t } = useTranslation();
	const changeUser = async (userId, data) => {
		toast.dismiss();
		await updateUser(userId, data);
		onEnd && onEnd();
	};

	return (
		<Menu
			align="center"
			direction="left"
			isOpen={isOpen}
			anchorRef={anchorRef}
			skipClick={skipClick}
			onClose={onClose}
		>
			{user.admin ? (
				<MenuItem onClick={() => changeUser(user.id, { admin: false })}>
					{t('Cancel admin')}
				</MenuItem>
			) : (
				<MenuItem onClick={() => changeUser(user.id, { admin: true })}>
					{t('Set as admin')}
				</MenuItem>
			)}
			{!user.suspended ? (
				<MenuItem onClick={() => changeUser(user.id, { suspended: true })}>
					{t('Suspend account')}
				</MenuItem>
			) : (
				<MenuItem onClick={() => changeUser(user.id, { suspended: false })}>
					{t('Activate account')}
				</MenuItem>
			)}
		</Menu>
	);
};

export default ActionPopover;
