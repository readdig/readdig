import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import { getBlocklist, updateBlocklist } from '../../api/blocklist';

const Blocklist = () => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors, reset } = useForm();

	useEffect(() => {
		const fetchData = async () => {
			const res = await getBlocklist();
			reset({
				feedUrls: res.data.feedUrls ? res.data.feedUrls.join('\n') : '',
				unsafeUrls: res.data.unsafeUrls ? res.data.unsafeUrls.join('\n') : '',
				imageUrls: res.data.imageUrls ? res.data.imageUrls.join('\n') : '',
			});
		};

		fetchData();
	}, [reset]);

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const obj = {
				feedUrls: data.feedUrls
					? data.feedUrls
							.split('\n')
							.filter((f) => f)
							.map((f) => f.trim())
					: [],
				unsafeUrls: data.unsafeUrls
					? data.unsafeUrls
							.split('\n')
							.filter((f) => f)
							.map((f) => f.trim())
					: [],
				imageUrls: data.imageUrls
					? data.imageUrls
							.split('\n')
							.filter((f) => f)
							.map((f) => f.trim())
					: [],
			};
			await updateBlocklist(obj);
			setSubmitting(false);
			toast.success(t('The blacklist has been updated.'));
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Blocklist')} />
			<h1>{t('Blocklist')}</h1>
			<form className="settings-form" onSubmit={handleSubmit(onSubmit)}>
				<div className={classNames('form-group', { error: errors.feedUrls })}>
					<label>{t('Feed URL')}</label>
					<textarea rows={10} name="feedUrls" ref={register} />
					<div className="note">
						{t('Feed URL not allowed to be added, multiple newlines.')}
					</div>
				</div>
				<div className={classNames('form-group', { error: errors.unsafeUrls })}>
					<label>{t('Unsafe URL')}</label>
					<textarea rows={10} name="unsafeUrls" ref={register} />
					<div className="note">{t('Unsafe URL, multiple newlines.')}</div>
				</div>
				<div className={classNames('form-group', { error: errors.imageUrls })}>
					<label>{t('Image URL')}</label>
					<textarea rows={10} name="imageUrls" ref={register} />
					<div className="note">
						{t('Image URL not allowed to be downloaded, multiple newlines.')}
					</div>
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

export default Blocklist;
