import React, { useState } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import { updateUser } from '../../api/user';

const UserPassword = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const history = useHistory();
	const user = useSelector((state) => state.user || {});
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, getValues } = useForm();

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await updateUser(dispatch, user.id, {
				password: data.password,
				oldPassword: data.oldPassword,
			});
			setSubmitting(false);
			toast.success(t('The password has been changed, please log in again.'));
			localStorage.removeItem('authedUser');
			history.push('/login');
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Change password')} />
			<h1>{t('Change password')}</h1>
			<form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
				<div
					className={classNames('form-group', 'required', { error: errors.oldPassword })}
				>
					<label>{t('Old password')}</label>
					<input
						type="password"
						name="oldPassword"
						autoComplete="off"
						ref={register({
							required: true,
						})}
					/>
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
				<div className="form-group">
					<button className="btn primary" disabled={submitting} type="submit">
						{t('Save')}
					</button>
				</div>
			</form>
		</>
	);
};

export default UserPassword;
