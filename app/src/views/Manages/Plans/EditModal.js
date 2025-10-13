import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Select from '../../../components/Select';
import PlanSelect from '../../../components/PlanSelect';
import { billingTypeOptions } from '../../../utils/options';
import { updatePlan } from '../../../api/plan';

import { ReactComponent as ExitIcon } from '../../../images/icons/close.svg';

const EditModal = ({ isOpen = false, plan = {}, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { control, register, handleSubmit, errors, reset } = useForm();

	useEffect(() => {
		reset({
			name: plan.name,
			slogan: plan.slogan,
			productId: plan.productId,
			billingPeriod: plan.billingPeriod,
			billingType: plan.billingType,
			basePrice: plan.basePrice,
			features: plan.features,
		});
	}, [plan, reset]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await updatePlan(plan.id, data);
			onClose();
			onEnd && onEnd();
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		isOpen && (
			<ReactModal
				className="modal"
				isOpen={true}
				ariaHideApp={false}
				onRequestClose={onClose}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('Edit {{planName}} plan', { planName: plan.name })}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', { error: errors.productId })}>
						<label>ID (Paddle ID)</label>
						<PlanSelect
							control={control}
							name="productId"
							disabled={plan.isSubscription}
						/>
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
							disabled={plan.isSubscription}
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
							disabled={plan.isSubscription}
							ref={register({ required: true, min: 1 })}
						/>
					</div>
					<div className={classNames('form-group', 'required', { error: errors.name })}>
						<label>{t('Name')}</label>
						<input type="text" name="name" ref={register({ required: true })} />
					</div>
					<div className={classNames('form-group', 'required', { error: errors.slogan })}>
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
						className={classNames('form-group', 'required', { error: errors.basePrice })}
					>
						<label>{t('Price')}</label>
						<input
							type="number"
							min={0}
							step={0.01}
							name="basePrice"
							disabled={plan.isSubscription}
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
						<button type="button" className="btn link cancel" onClick={onClose}>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</ReactModal>
		)
	);
};

export default EditModal;
