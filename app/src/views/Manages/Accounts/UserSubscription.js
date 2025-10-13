import React from 'react';
import { useTranslation } from 'react-i18next';

import Time from '../../../components/Time';

const UserSubscription = ({ user }) => {
	const { t } = useTranslation();
	const subscription = user.subscription;

	if (subscription) {
		return (
			<div className="meta">
				<span className={subscription.expired ? 'expired' : 'active'}>
					{subscription.plan.name}
					{', '}
					{subscription.expired ? (
						t('Expired')
					) : (
						<>
							{subscription.plan.basePrice === 0 || subscription.status === 'cancelled'
								? t('Expires on') + ' '
								: t('Renews on') + ' '}
							<Time format="ll" value={subscription.nextBillDate} /> (in UTC)
						</>
					)}
				</span>
			</div>
		);
	}

	return null;
};

export default UserSubscription;
