import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconLoader } from '@tabler/icons-react';

const Loader = () => {
	const { t } = useTranslation();

	return (
		<div className="loader" title={t('Loading')}>
			<IconLoader />
		</div>
	);
};

export default Loader;
