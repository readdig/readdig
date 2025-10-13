import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import Upload from '../../components/Avatar/Upload';
import { updateUser } from '../../api/user';

const UserProfile = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const user = useSelector((state) => state.user || {});
	const [submitting, setSubmitting] = useState(false);
	const [avatar, setAvatar] = useState(user.avatar);
	const { register, handleSubmit, errors, reset } = useForm();

	useEffect(() => {
		reset({
			name: user.name,
			username: user.username,
			email: user.email,
			url: user.url,
			bio: user.bio,
		});
	}, [user, reset]);

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await updateUser(dispatch, user.id, { ...data, avatar });
			setSubmitting(false);
			toast.success(t('Profile saved'));
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Profile')} />
			<h1>{t('Profile')}</h1>
			<form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
				<div className="form-group">
					<Upload value={avatar} onChange={setAvatar} />
					<div className="note">
						{t(
							'You can click the button or drag here to upload, and adjust the size and position.',
						)}
					</div>
				</div>
				<div className={classNames('form-group', 'required', { error: errors.name })}>
					<label>{t('Nickname')}</label>
					<input
						type="text"
						name="name"
						ref={register({
							required: true,
							minLength: 3,
							maxLength: 20,
						})}
					/>
					<div className="note">{t('Consists of 3-20 characters')}</div>
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
				<div className={classNames('form-group', 'required', { error: errors.email })}>
					<label>{t('Email')}</label>
					<input
						type="email"
						name="email"
						disabled={true}
						ref={register({
							required: true,
							/* eslint-disable */
							pattern:
								/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
						})}
					/>
				</div>
				<div className="form-group">
					<label>{t('Website')}</label>
					<input type="url" name="url" ref={register} />
				</div>
				<div className="form-group">
					<label>{t('Bio')}</label>
					<textarea
						rows="5"
						maxLength="280"
						name="bio"
						ref={register({
							maxLength: 280,
						})}
					/>
				</div>
				<div className="form-group">
					<button type="submit" className="btn primary" disabled={submitting}>
						{t('Save')}
					</button>
				</div>
			</form>
		</>
	);
};

export default UserProfile;
