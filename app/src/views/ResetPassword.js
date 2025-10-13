import React, { useState } from 'react';
import classNames from 'classnames';
import { Link, useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../components/PageTitle';
import { resetPassword } from '../api/auth';

const ResetPassword = () => {
	const { t } = useTranslation();
	const history = useHistory();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, getValues } = useForm();

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await resetPassword(data.email.toLowerCase(), data.recoveryCode, data.password);
			setSubmitting(false);
			history.push('/login');
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<div className="auth-view">
			<PageTitle title={t('Reset password')} />
			<Link className="logo" title={t('Home')} to="/">
				<img src="/favicons/logo.png" alt="" />
			</Link>
			<form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
				<h2>{t('Reset password')}</h2>
				<p>
					{t('Enter the security code you received and we will reset your password.')}
				</p>
				<div className={classNames('form-group', 'required', { error: errors.email })}>
					<label>{t('Email')}</label>
					<input
						type="email"
						name="email"
						autoComplete="email"
						autoFocus={true}
						ref={register({
							required: true,
							/* eslint-disable */
							pattern:
								/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
						})}
					/>
					<div className="note">{t('Registered email address')}</div>
				</div>
				<div
					className={classNames('form-group', 'required', { error: errors.recoveryCode })}
				>
					<label>{t('Security code')}</label>
					<input type="text" name="recoveryCode" ref={register({ required: true })} />
					<div className="note">{t('Security code received in email')}</div>
				</div>
				<div className={classNames('form-group', 'required', { error: errors.password })}>
					<label>{t('New password')}</label>
					<input
						type="password"
						name="password"
						autoComplete="off"
						ref={register({
							required: true,
							minLength: 6,
						})}
					/>
					<div className="note">
						{t(
							'Use at least 6 or more characters (combination of letters, numbers and symbols)',
						)}
					</div>
				</div>
				<div
					className={classNames('form-group', 'required', {
						error: errors.passwordConfirmation,
					})}
				>
					<label>{t('Confirm password')}</label>
					<input
						type="password"
						name="passwordConfirmation"
						autoComplete="off"
						ref={register({
							required: true,
							validate: {
								matchesPreviousPassword: (value) => {
									const { password } = getValues();
									return (
										password === value ||
										t('The confirm password is wrong, please re-enter.')
									);
								},
							},
						})}
					/>
					{errors.passwordConfirmation && (
						<div className="note">{errors.passwordConfirmation.message}</div>
					)}
				</div>
				<button
					type="submit"
					className="btn primary"
					name="reset-password"
					disabled={submitting}
				>
					{t('Reset')}
				</button>
			</form>
			<p className="back">
				<Link to={'/forgot-password'}>{t('Back')}</Link>
			</p>
		</div>
	);
};

export default ResetPassword;
