import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

const useSubscriptionExpired = () => {
	const history = useHistory();
	const location = useLocation();
	const url = location.pathname;
	const user = useSelector((state) => state.user || {});
	const isAdmin = user.admin;
	const isSubscriptionExpired =
		!user.subscription || (user.subscription && user.subscription.expired);

	useEffect(() => {
		const ignoreUrls = [
			'/settings$',
			'/settings/opml',
			'/settings/delete-account',
			'/settings/help',
			'/settings/plans',
			'/settings/billing',
			'/settings/pay/(.*)',
		];
		if (
			!isAdmin &&
			isSubscriptionExpired &&
			!ignoreUrls.some((pattern) => new RegExp(pattern).test(url))
		) {
			history.push('/settings/plans');
		}
	}, [history, isAdmin, isSubscriptionExpired, url]);
};

export default useSubscriptionExpired;
