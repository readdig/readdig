import React from 'react';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import Pricings from '../../components/Pricings';

const Plans = () => {
	const { t } = useTranslation();

	return (
		<>
			<PageTitle title={t('Plans')} />
			<Pricings />
		</>
	);
};

export default Plans;
