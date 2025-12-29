import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { deleteHistory } from '../../api/user';
import PageTitle from '../../components/PageTitle';
import PasswordModal from '../../components/PasswordModal';

const History = () => {
	const { t } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const [services, setServices] = useState();
	const [modalIsOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const { register, errors, handleSubmit } = useForm();

	const openModal = (data) => {
		setServices(data.services);
		setIsOpen(true);
	};

	const closeModal = () => {
		setIsOpen(false);
	};

	const onSubmit = async (data) => {
		try {
			if (services && services.length) {
				toast.dismiss();
				setSubmitting(true);
				await deleteHistory(user.id, services, data.password);
				setSubmitting(false);
				toast.success(t('History cleared'));
				closeModal();
			}
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Clear history')} />
			<h1>{t('Clear history')}</h1>
			<form className="settings-form" onSubmit={handleSubmit(openModal)}>
				<div className={classNames('form-group', 'checkbox', { error: errors.services })}>
					<label>
						<input
							type="checkbox"
							value="stars"
							name="services"
							ref={register({ required: true })}
						/>
						<span>{t('My Stars')}</span>
					</label>
					<div className="note">{t('Clear starred article history')}</div>
				</div>
				<div className={classNames('form-group', 'checkbox', { error: errors.services })}>
					<label>
						<input
							type="checkbox"
							value="recent-read"
							name="services"
							ref={register({ required: true })}
						/>
						<span>{t('Recent Read')}</span>
					</label>
					<div className="note">{t('Clear read article history')}</div>
				</div>
				<div className={classNames('form-group', 'checkbox', { error: errors.services })}>
					<label>
						<input
							type="checkbox"
							value="recent-played"
							name="services"
							ref={register({ required: true })}
						/>
						<span>{t('Recent Played')}</span>
					</label>
					<div className="note">{t('Clear played podcast history')}</div>
				</div>
				<div className="form-buttons">
					<button className="btn delete" type="submit">
						{t('Clear')}
					</button>
				</div>
			</form>
			<PasswordModal
				isOpen={modalIsOpen}
				submitting={submitting}
				closeModal={closeModal}
				onSubmit={onSubmit}
			/>
		</>
	);
};

export default History;
