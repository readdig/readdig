import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import { getEmail, sendEmail } from '../../api/email';

const Mail = () => {
	const { t } = useTranslation();
	const [userId, setUserId] = useState();
	const [emailHTML, setEmailHTML] = useState();
	const [submitting, setSubmitting] = useState(false);

	const getMailContent = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const res = await getEmail(userId);
			setEmailHTML(res.data);
			setSubmitting(false);
		} catch (err) {
			setSubmitting(false);
		}
	};

	const sendMailContent = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await sendEmail(userId);
			setEmailHTML('Sending successfully');
			setSubmitting(false);
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Mail test')} />
			<h1>{t('Mail test')}</h1>
			<form className="settings-form">
				<div className="form-group">
					<input
						type="text"
						name="userId"
						placeholder={t('User ID')}
						onChange={(e) => {
							setUserId(e.target.value);
						}}
					/>
					<div className="note">
						{t('Enter a user id to send a test email for that admin user')}
					</div>
				</div>
				<div className="form-group">
					<button
						type="button"
						className="btn primary"
						disabled={submitting || !userId}
						onClick={sendMailContent}
					>
						{t('Send')}
					</button>
					<button
						type="button"
						className="btn"
						disabled={submitting || !userId}
						onClick={getMailContent}
					>
						{t('Preview')}
					</button>
				</div>
				<p dangerouslySetInnerHTML={{ __html: emailHTML }} />
			</form>
		</>
	);
};

export default Mail;
