import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deleteUser } from '../../api/user';
import PageTitle from '../../components/PageTitle';
import PasswordModal from '../../components/PasswordModal';

const UserDelete = () => {
	const { t } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const [modalIsOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const openModal = () => {
		setIsOpen(true);
	};

	const closeModal = () => {
		setIsOpen(false);
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await deleteUser(user.id, data.password);
			localStorage.clear();
			window.location = '/';
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Delete account')} />
			<h1>{t('Delete account')}</h1>
			<div className="settings-form">
				<div className="form-group">
					{t('Once the account is deleted, it cannot be recovered, please be sure.')}
				</div>
				<div className="form-group">
					<button className="btn delete" onClick={openModal} type="button">
						{t('Delete')}
					</button>
				</div>
			</div>
			<PasswordModal
				isOpen={modalIsOpen}
				submitting={submitting}
				closeModal={closeModal}
				onSubmit={onSubmit}
			/>
		</>
	);
};

export default UserDelete;
