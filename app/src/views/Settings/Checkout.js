// https://developer.paddle.com/getting-started/c052e9e8d265f-working-with-the-paddle-sandbox
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import config from '../../config';
import useDarkMode from '../../hooks/useDarkMode';
import Loader from '../../components/Loader';
import PageTitle from '../../components/PageTitle';
import delay from '../../utils/delay';
import { parseBillingType } from '../../utils/parsers';
import { getSubscription, txnSubscription } from '../../api/subscription';

const delayTxnSubscription = async function (checkoutId, maxRetryCount = 2) {
	let retryCount = 0;
	let success = false;

	while (retryCount < maxRetryCount && !success) {
		try {
			await delay(3000);
			await txnSubscription(checkoutId);
			success = true;
		} catch {
			retryCount++;
		}
	}

	const successUrl = `${config.product.url}/settings/pay/success`;
	window.location.replace(successUrl);
};

const Checkout = () => {
	const Paddle = window.Paddle;
	const { t, i18n } = useTranslation();
	const theme = useDarkMode();
	const user = useSelector((state) => state.user || {});
	const { subscriptionId } = useParams();
	const [subscription, setSubscription] = useState();
	const [loading, setLoading] = useState(true);
	const language = i18n.language === 'zh-cn' ? 'zh-Hans' : i18n.language;

	const getCheckout = useCallback(
		(subscription) => {
			if (Paddle && Paddle.Checkout) {
				Paddle.Checkout.open({
					method: 'inline',
					locale: language,
					allowQuantity: false,
					disableLogout: true,
					marketingConsent: '0',
					displayModeTheme: theme,
					frameTarget: 'checkout-container',
					frameInitialHeight: 450,
					frameStyle:
						'width:100%;min-width:312px;background-color:transparent;border:none;',
					email: user.email,
					product: subscription.plan.productId,
					title: subscription.plan.name,
					passthrough: { userId: user.id, subscriptionId: subscription.id },
					successCallback: async function (data) {
						Paddle.Spinner.show();
						await delayTxnSubscription(data.checkout.id);
						Paddle.Spinner.hide();
					},
				});
			}
		},
		[theme, language, user, Paddle],
	);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await getSubscription(subscriptionId);
				setSubscription(res.data);
				setLoading(false);
				getCheckout(res.data);
			} catch (err) {
				window.location.replace('/settings/plans');
			}
		};

		fetchData();
	}, [subscriptionId, getCheckout]);

	return (
		<>
			<PageTitle title={t('Checkout')} />
			<div className="checkout">
				{loading && <Loader />}
				{!loading && subscription && (
					<div className="plan">
						<div>{subscription.plan.name}</div>
						<div>
							US${subscription.plan.basePrice}/
							{parseBillingType(
								subscription.plan.billingPeriod,
								subscription.plan.billingType,
							)}
						</div>
					</div>
				)}
				<div className="checkout-container" />
			</div>
		</>
	);
};

export default Checkout;
