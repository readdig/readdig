import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import { opmlDownload } from '../../api/opml';

const OPML = () => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);

	const download = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const res = await opmlDownload();
			if (res.data) {
				const link = document.createElement('a');
				const blob = new Blob([res.data], { type: 'text/xml' });
				link.href = URL.createObjectURL(blob);
				link.download = 'readdig.com-opml.xml';
				link.click();
			}
			setSubmitting(false);
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		<>
			<PageTitle title={t('Export OPML')} />
			<h1>{t('Export OPML')}</h1>
			<form className="settings-form">
				<div className="form-group">{t('Export my feeds to an OPML file.')}</div>
				<div className="form-group">
					<button
						className="btn primary"
						onClick={download}
						type="button"
						disabled={submitting}
					>
						{t('Export')}
					</button>
				</div>
			</form>
		</>
	);
};

export default OPML;
