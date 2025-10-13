import React from 'react';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import DarkMode from '../../components/DarkMode';

const Themes = () => {
	const { t } = useTranslation();

	return (
		<>
			<PageTitle title={t('Themes')} />
			<h1>{t('Themes')}</h1>
			<form className="settings-form">
				<div className="form-group radio">
					<DarkMode />
				</div>
			</form>
		</>
	);
};

export default Themes;
