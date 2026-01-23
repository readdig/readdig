import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import Header from '../../components/Header';
import useFontSize from '../../hooks/useFontSize';
import useWindowScroll from '../../hooks/useWindowScroll';
import useSubscriptionExpired from '../../hooks/useSubscriptionExpired';
import Menu from './Menu';
import Feeds from './Feeds';
import Themes from './Themes';
import OPML from './OPML';
import UserProfile from './UserProfile';
import UserPassword from './UserPassword';
import UserDelete from './UserDelete';
import Help from './Help';
import History from './History';
import Settings from './Settings';
import Checkout from './Checkout';
import Plans from './Plans';
import Billing from './Billing';
import PaySuccess from './PaySuccess';
import config from '../../config';

const Index = () => {
	useFontSize();
	useWindowScroll();
	useSubscriptionExpired();
	const { t } = useTranslation();

	return (
		<>
			<Header icon="home" />
			<div className="settings">
				<PageTitle title={t('Settings')} />
				<div className="settings-menu">
					<Menu />
				</div>
				<div className="settings-content">
					<Switch>
						<Route component={Settings} path="/settings/preferences" />
						<Route component={Feeds} path="/settings/feeds" />
						<Route component={Themes} path="/settings/themes" />
						<Route component={UserProfile} path="/settings/profile" />
						<Route component={UserPassword} path="/settings/security" />
						<Route component={UserDelete} path="/settings/delete-account" />
						<Route component={OPML} path="/settings/opml" />
						<Route component={Help} path="/settings/helps" />
						<Route component={History} path="/settings/history" />
						{!config.freeMode && <Route component={Plans} path="/settings/plans" />}
						{!config.freeMode && <Route component={Billing} path="/settings/billing" />}
						{!config.freeMode && (
							<Route component={PaySuccess} path="/settings/pay/success" />
						)}
						{!config.freeMode && (
							<Route component={Checkout} path="/settings/pay/:subscriptionId" />
						)}
					</Switch>
				</div>
			</div>
		</>
	);
};

export default Index;
