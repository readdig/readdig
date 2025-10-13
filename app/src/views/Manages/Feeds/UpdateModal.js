import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { updateFeed } from '../../../api/feed';
import { feedTypeOptions, scrapeIntervalOptions } from '../../../utils/options';
import Select from '../../../components/Select';

import { ReactComponent as ExitIcon } from '../../../images/icons/close.svg';

const UpdateModal = ({ isOpen = false, feed = {}, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const { control, register, handleSubmit, reset, errors } = useForm();

	useEffect(() => {
		reset({
			title: feed.title,
			type: feed.type,
			feedUrl: feed.feedUrl,
			feedUrls: feed.feedUrls ? feed.feedUrls.join('\n') : '',
			canonicalUrl: feed.canonicalUrl,
			featuredUrl: feed.images ? feed.images.featured : '',
			bannerUrl: feed.images ? feed.images.banner : '',
			faviconUrl: feed.images ? feed.images.favicon : '',
			iconUrl: feed.images ? feed.images.icon : '',
			ogUrl: feed.images ? feed.images.og : '',
			scrapeInterval: parseInt(feed.scrapeInterval || 0),
		});
	}, [feed, reset]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const obj = {
				title: data.title,
				type: data.type,
				feedUrl: data.feedUrl,
				feedUrls: data.feedUrls
					? data.feedUrls
							.split('\n')
							.filter((f) => f)
							.map((f) => f.trim())
					: [],
				canonicalUrl: data.canonicalUrl,
				images: {
					featured: data.featuredUrl || '',
					banner: data.bannerUrl || '',
					favicon: data.faviconUrl || '',
					icon: data.iconUrl || '',
					og: data.ogUrl || '',
				},
				scrapeInterval: parseInt(data.scrapeInterval),
			};
			await updateFeed(feed.id, obj);
			onEnd && onEnd();
			onClose();
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
					<h1>{t('Edit feed')}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', 'required', { error: errors.title })}>
						<label>{t('Title')}</label>
						<input
							type="text"
							autoComplete="false"
							name="title"
							ref={register({ required: true })}
						/>
					</div>
					<div
						className={classNames('form-group', 'required', {
							error: errors.scrapeInterval,
						})}
					>
						<label>
							{t('Crawl interval')}
							<span className="note">({t('minute')})</span>
						</label>
						<Select
							control={control}
							name="scrapeInterval"
							rules={{ required: true }}
							options={scrapeIntervalOptions.map(({ value, label }) => ({
								value,
								label: t(label),
							}))}
						/>
					</div>
					<div className={classNames('form-group', 'required', { error: errors.type })}>
						<label>{t('Type')}</label>
						<Select
							control={control}
							name="type"
							rules={{ required: true }}
							options={feedTypeOptions.map(({ value, label }) => ({
								value,
								label: t(label),
							}))}
						/>
					</div>
					<div
						className={classNames('form-group', 'required', { error: errors.feedUrl })}
					>
						<label>{t('Feed URL')}</label>
						<input
							type="url"
							autoComplete="false"
							name="feedUrl"
							disabled={feed.duplicateOf}
							ref={register({ required: true })}
						/>
					</div>
					<div className={classNames('form-group', { error: errors.feedUrls })}>
						<label>{t('Feed URLs')}</label>
						<textarea rows="3" name="feedUrls" ref={register} />
						<div className="note">{t('Feed URLs, multiple newlines.')}</div>
					</div>
					<div className={classNames('form-group', { error: errors.canonicalUrl })}>
						<label>{t('Canonical URL')}</label>
						<input type="url" autoComplete="false" name="canonicalUrl" ref={register} />
					</div>
					<div className={classNames('form-group', { error: errors.featuredUrl })}>
						<label>{t('Featured URL')}</label>
						<input type="url" autoComplete="false" name="featuredUrl" ref={register} />
					</div>
					<div className={classNames('form-group', { error: errors.bannerUrl })}>
						<label>{t('Banner URL')}</label>
						<input type="url" autoComplete="false" name="bannerUrl" ref={register} />
					</div>
					<div className={classNames('form-group', { error: errors.faviconUrl })}>
						<label>{t('Favicon URL')}</label>
						<input type="url" autoComplete="false" name="faviconUrl" ref={register} />
					</div>
					<div className={classNames('form-group', { error: errors.iconUrl })}>
						<label>{t('Icon URL')}</label>
						<input type="url" autoComplete="false" name="iconUrl" ref={register} />
					</div>
					<div className={classNames('form-group', { error: errors.ogUrl })}>
						<label>{t('OG URL')}</label>
						<input type="url" autoComplete="false" name="ogUrl" ref={register} />
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

export default UpdateModal;
