import React, { useState } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Select from '../../../components/Select';
import PlanSelect from '../../../components/PlanSelect';
import { billingTypeOptions } from '../../../utils/options';
import { addPlan } from '../../../api/plan';

import { IconPlus, IconX } from '@tabler/icons-react';

const AddModal = ({ onEnd }) => {
	const { t } = useTranslation();
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const { control, register, handleSubmit, errors } = useForm({
		defaultValues: {
			billingPeriod: 1,
			basePrice: 0,
		},
	});

	const openModal = () => {
		setModalIsOpen(true);
	};

	const closeModal = () => {
		toast.dismiss();
		setSubmitting(false);
		setModalIsOpen(false);
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await addPlan(data);
			closeModal();
			onEnd && onEnd();
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<div className="btn" onClick={openModal}>
				<IconPlus />
			</div>
			{modalIsOpen && (
				<ReactModal
					className="modal"
					isOpen={true}
					ariaHideApp={false}
					onRequestClose={closeModal}
					overlayClassName="modal-overlay"
					shouldCloseOnOverlayClick={true}
				>
					<header>
						<h1>{t('New plan')}</h1>
						<span className="exit" onClick={closeModal}>
							<IconX />
						</span>
					</header>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className={classNames('form-group', { error: errors.productId })}>
							<label>ID (Paddle ID)</label>
							<PlanSelect control={control} name="productId" />
						</div>
						<div
							className={classNames('form-group', 'required', {
								error: errors.billingType,
							})}
						>
							<label>{t('Billing Type')}</label>
							<Select
								control={control}
								name="billingType"
								options={billingTypeOptions}
								defaultValue={1}
							/>
						</div>
						<div
							className={classNames('form-group', 'required', {
								error: errors.billingPeriod,
							})}
						>
							<label>{t('Billing Period')}</label>
							<input
								type="number"
								min={1}
								step={1}
								name="billingPeriod"
								ref={register({ required: true, min: 1 })}
							/>
						</div>
						<div className={classNames('form-group', 'required', { error: errors.name })}>
							<label>{t('Name')}</label>
							<input type="text" name="name" ref={register({ required: true })} />
						</div>
						<div
							className={classNames('form-group', 'required', { error: errors.slogan })}
						>
							<label>{t('Slogan')}</label>
							<input
								type="text"
								name="slogan"
								ref={register({
									required: true,
								})}
							/>
						</div>
						<div
							className={classNames('form-group', 'required', {
								error: errors.basePrice,
							})}
						>
							<label>{t('Price')}</label>
							<input
								type="number"
								min={0}
								step={0.01}
								name="basePrice"
								ref={register({ required: true, min: 0 })}
							/>
						</div>
						<div className={classNames('form-group', { error: errors.features })}>
							<label>{t('Features')}</label>
							<textarea rows="3" placeholder="" name="features" ref={register} />
						</div>
						<div className="buttons">
							<button type="submit" className="btn primary" disabled={submitting}>
								{t('Save')}
							</button>
							<button type="button" className="btn link cancel" onClick={closeModal}>
								{t('Cancel')}
							</button>
						</div>
					</form>
				</ReactModal>
			)}
		</>
	);
};

export default AddModal;
