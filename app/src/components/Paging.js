import React from 'react';
import { useTranslation } from 'react-i18next';

const Paging = ({ page = 1, per_page = 10, totals = 0, onChange }) => {
	const { t } = useTranslation();

	return (
		<div className="paging">
			{page === 1 && <div className="disabled">&lt;&lt; {t('Previous page')}</div>}
			{page > 1 && (
				<div onClick={() => onChange(page - 1)}>&lt;&lt; {t('Previous page')}</div>
			)}
			{totals === per_page && (
				<div onClick={() => onChange(page + 1)}>{t('Next page')} &gt;&gt;</div>
			)}
			{totals < per_page && <div className="disabled">{t('Next page')} &gt;&gt;</div>}
		</div>
	);
};

export default Paging;
