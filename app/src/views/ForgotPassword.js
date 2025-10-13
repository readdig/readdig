import React, { useState } from 'react';
import classNames from 'classnames';
import { Link, useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../components/PageTitle';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
	const { t } = useTranslation();
	const history = useHistory();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors } = useForm();

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await forgotPassword(data.email);
			setSubmitting(false);
			history.push('/reset-password');
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
					{t(
						'Enter your email address and we will send you a security code to reset your password.',
					)}
				</p>
				<div className={classNames('form-group', { error: errors.email })}>
					<input
						type="email"
						name="email"
						autoComplete="email"
						autoFocus={true}
						placeholder={t('Email')}
						ref={register({
							required: true,
							/* eslint-disable */
							pattern:
								/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
						})}
					/>
				</div>
				<button
					className="btn primary"
					type="submit"
					name="forgot-password"
					disabled={submitting}
				>
					{t('Send')}
				</button>
			</form>
			<p className="back">
				<Link to={`/login`}>{t('Back')}</Link>
			</p>
		</div>
	);
};

export default ForgotPassword;
