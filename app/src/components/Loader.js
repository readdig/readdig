import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LoaderIcon } from '../images/loaders/default.svg';

const Loader = ({ defaultLoader = true, radius = 28 }) => {
	const { t } = useTranslation();

	return defaultLoader ? (
		<div className="loader" title={t('Loading')}>
			<LoaderIcon />
		</div>
	) : (
		<div
			className="loader-roll"
			style={{ width: radius, height: radius }}
			title={t('Loading')}
		/>
	);
};

export default Loader;
