import React, { useState } from 'react';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../components/PageTitle';
import { signup } from '../api/auth';

const Signup = () => {
	const { t, i18n } = useTranslation();
	const history = useHistory();
	const dispatch = useDispatch();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, getValues } = useForm();

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await signup(dispatch, data.username, data.email, data.password, i18n.language);
			setSubmitting(false);
			history.push('/settings/plans');
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<div className="auth-view">
			<PageTitle title={t('Signup')} />
			<Link className="logo" title={t('Home')} to="/">
				<img src="/favicons/logo.png" alt="" />
			</Link>
			<form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
				<h2>{t('Create an account')}</h2>
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
					<div className="note">{t('Enter an email address')}</div>
				</div>
				<div className={classNames('form-group', 'required', { error: errors.username })}>
					<label>{t('Username')}</label>
					<input
						type="text"
						name="username"
						ref={register({
							required: true,
							minLength: 3,
							maxLength: 20,
							pattern: /^(?=.{3,20}$)(?![-_.])(?!.*[-_.]{2})[a-zA-Z0-9-_.]+[^-_.]$/i,
						})}
					/>
					<div className="note">
						{t('Consists of 3-20 letters, numbers and dots, underscores, dashes')}
					</div>
				</div>
				<div className={classNames('form-group', 'required', { error: errors.password })}>
					<label>{t('Password')}</label>
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
				<button type="submit" className="btn primary" disabled={submitting}>
					{t('Signup')}
				</button>
			</form>
			<p className="info">
				{t('Already have an account?')}
				<Link to="/login">{t('Login')}</Link>
			</p>
		</div>
	);
};

export default Signup;
