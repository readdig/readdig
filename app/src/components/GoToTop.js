import React from 'react';
import classNames from 'classnames';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UpIcon } from '../images/icons/arrow-up.svg';

const GoToTop = ({ hidden, onClick }) => {
	const { t } = useTranslation();
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1023px)' });

	return (
		isTabletOrMobile && (
			<div
				className={classNames('go-to-top', { hide: hidden })}
				onClick={onClick}
				title={t('Go to Top')}
			>
				<UpIcon />
			</div>
		)
	);
};

export default GoToTop;
