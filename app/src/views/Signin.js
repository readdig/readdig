import React, { useState } from 'react';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import { Link, useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../components/PageTitle';
import { login } from '../api/auth';

const Signin = () => {
	const { t } = useTranslation();
	const history = useHistory();
	const dispatch = useDispatch();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors } = useForm();

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await login(dispatch, data.email, data.password);
			setSubmitting(false);
			history.push('/');
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<div className="auth-view">
			<PageTitle title={t('Login')} />
			<Link className="logo" title={t('Home')} to="/">
				<img src="/favicons/logo.png" alt="" />
			</Link>
			<form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
				<div className={classNames('form-group', { error: errors.email })}>
					<input
						type="text"
						name="email"
						autoComplete="username"
						autoFocus={true}
						placeholder={t('Email and Username')}
						ref={register({ required: true })}
					/>
				</div>
				<div className={classNames('form-group', { error: errors.password })}>
					<input
						type="password"
						name="password"
						autoComplete="off"
						placeholder={t('Password')}
						ref={register({ required: true })}
					/>
				</div>
				<button type="submit" className="btn primary" disabled={submitting}>
					{t('Login')}
				</button>
			</form>
			<p className="info">
				{t("Don't have an account yet?")}
				<Link to="/signup">{t('Create an account')}</Link>
			</p>
			<p className="info">
				{t('Forget password?')}
				<Link to="/forgot-password">{t('Reset password')}</Link>
			</p>
		</div>
	);
};

export default Signin;
