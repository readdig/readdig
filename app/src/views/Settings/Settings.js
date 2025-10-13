import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { updateUser } from '../../api/user';
import PageTitle from '../../components/PageTitle';
import FontSize from '../../components/FontSize';
import LanguageSelect from '../../components/LanguageSelect';

const Settings = () => {
	const dispatch = useDispatch();
	const { t, i18n } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const [submitting, setSubmitting] = useState(false);
	const [data, setData] = useState({});

	useEffect(() => {
		const settings = user.settings || {};
		setData({
			unreadOnly: settings.unreadOnly || false,
			mobileHideSidebar: settings.mobileHideSidebar || false,
			fontSize: settings.fontSize || 0,
			textSize: settings.textSize || 0,
			language: settings.language || i18n.language,
		});
	}, [user, i18n.language]);

	const onChange = async (key, value) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const settings = { ...data, [key]: value };
			await updateUser(dispatch, user.id, { settings: settings });
			if (key === 'language') {
				i18n.changeLanguage(value);
			}
			setSubmitting(false);
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Preferences')} />
			<h1>{t('Preferences')}</h1>
			<form className="settings-form">
				<div className="form-group checkbox">
					<label>
						<input
							type="checkbox"
							name="unreadOnly"
							checked={data.unreadOnly || false}
							disabled={submitting}
							onChange={(e) => onChange('unreadOnly', e.target.checked)}
						/>
						<span>{t('Only show unread articles')}</span>
					</label>
					<div className="note">
						{t('Filter read articles, not displayed in the article list.')}
					</div>
				</div>
				<div className="form-group checkbox">
					<label>
						<input
							type="checkbox"
							name="mobileHideSidebar"
							checked={data.mobileHideSidebar || false}
							disabled={submitting}
							onChange={(e) => onChange('mobileHideSidebar', e.target.checked)}
						/>
						<span>{t('Hide the sidebar on mobile')}</span>
					</label>
					<div className="note">
						{t('On mobile devices, the mini menu on the left is not displayed.')}
					</div>
				</div>
				<div className="form-group input">
					<label>
						<span>{t('Language')}</span>
						<LanguageSelect
							value={data.language}
							onChange={(value) => onChange('language', value)}
						/>
					</label>
				</div>
				<div className="form-group input">
					<label>
						<span>{t('Global font size')}</span>
						<FontSize
							value={data.fontSize}
							onChange={(value) => onChange('fontSize', value)}
						/>
					</label>
				</div>
				<div className="form-group input">
					<label>
						<span>{t('Text font size')}</span>
						<FontSize
							value={data.textSize}
							onChange={(value) => onChange('textSize', value)}
						/>
					</label>
				</div>
			</form>
		</>
	);
};

export default Settings;
