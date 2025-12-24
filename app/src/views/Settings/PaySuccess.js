import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconCircleCheck } from '@tabler/icons-react';

const PaySuccess = () => {
	const { t } = useTranslation();

	return (
		<section className="payment success">
			<div className="icon">
				<IconCircleCheck />
			</div>
			<div className="text">{t('Payment Success!')}</div>
			<div className="small-text">{t('Thank you for subscribing to the plan.')}</div>
			<div className="buttons">
				<a
					className="btn primary"
					href="/settings/plans"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						window.location.replace('/settings/plans');
					}}
				>
					{t('Done')}
				</a>
			</div>
		</section>
	);
};

export default PaySuccess;
