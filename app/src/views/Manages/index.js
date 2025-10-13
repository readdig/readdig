import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import Header from '../../components/Header';
import useWindowScroll from '../../hooks/useWindowScroll';
import Menu from './Menu';
import Feeds from './Feeds';
import Articles from './Articles';
import Accounts from './Accounts';
import Mail from './Mail';
import Totals from './Totals';
import Blocklist from './Blocklist';
import Monitoring from './Monitoring';
import Plans from './Plans';
import Transaction from './Transaction';

const Manages = () => {
	useWindowScroll();

	const { t } = useTranslation();
	const user = useSelector((state) => state.user || {});

	if (!user.admin) {
		return <Redirect to="/404" />;
	}

	return (
		<>
			<Header icon="home" />
			<div className="settings">
				<PageTitle title={t('Dashboard')} />
				<div className="settings-menu">
					<Menu />
				</div>
				<div className="settings-content">
					<Switch>
						<Route component={Feeds} path="/manages/feeds" />
						<Route component={Articles} path="/manages/articles" />
						<Route component={Accounts} path="/manages/accounts" />
						<Route component={Mail} path="/manages/email" />
						<Route component={Totals} path="/manages/totals" />
						<Route component={Blocklist} path="/manages/blocklist" />
						<Route component={Monitoring} path="/manages/monitoring" />
						<Route component={Plans} path="/manages/plans" />
						<Route component={Transaction} path="/manages/transactions" />
					</Switch>
				</div>
			</div>
		</>
	);
};

export default Manages;
