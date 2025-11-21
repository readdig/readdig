import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { getUser } from './api/user';

import AuthedRoute from './AuthedRoute';
import UnauthedRoute from './UnauthedRoute';
import Player from './components/Player';
import Signup from './views/Signup';
import Signin from './views/Signin';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';
import Dashboard from './views/Dashboard';
import NotFound from './views/NotFound';
import Settings from './views/Settings';
import Manages from './views/Manages';
import Share from './views/Share';
import Welcome from './views/Welcome';

const AppRoute = () => {
	const dispatch = useDispatch();
	const { i18n } = useTranslation();
	const user = useSelector((state) => state.user || {});
	const language = (user.settings || {}).language;
	const currentUserId = user.id;

	useEffect(() => {
		const fetchUser = async () => {
			if (currentUserId) {
				await getUser(dispatch, currentUserId);
			}
		};

		fetchUser();
	}, [dispatch, currentUserId]);

	useEffect(() => {
		if (language) {
			i18n.changeLanguage(language);
		}
	}, [language, i18n]);

	return (
		<div className={classNames('app')}>
			<Switch>
				<AuthedRoute component={Dashboard} exact path="/" />
				<AuthedRoute component={Dashboard} exact path="/search" />
				<AuthedRoute component={Dashboard} view={true} path="/library/:libraryId" />
				<AuthedRoute component={Dashboard} exact path="/library" />
				<AuthedRoute component={Dashboard} view={true} path="/article/:articleId" />
				<AuthedRoute component={Dashboard} exact path="/stars" />
				<AuthedRoute component={Dashboard} view={true} path="/stars/article/:articleId" />
				<AuthedRoute component={Dashboard} exact path="/recent-read" />
				<AuthedRoute
					component={Dashboard}
					view={true}
					path="/recent-read/article/:articleId"
				/>
				<AuthedRoute component={Dashboard} exact path="/recent-played" />
				<AuthedRoute
					component={Dashboard}
					view={true}
					path="/recent-played/article/:articleId"
				/>
				<AuthedRoute component={Dashboard} exact path="/feed/:feedId" />
				<AuthedRoute
					component={Dashboard}
					view={true}
					path="/feed/:feedId/article/:articleId"
				/>
				<AuthedRoute component={Dashboard} exact path="/folder/:folderId" />
				<AuthedRoute
					component={Dashboard}
					view={true}
					path="/folder/:folderId/article/:articleId"
				/>
				<AuthedRoute component={Dashboard} exact path="/folder/:folderId/feed/:feedId" />
				<AuthedRoute
					component={Dashboard}
					view={true}
					path="/folder/:folderId/feed/:feedId/article/:articleId"
				/>
				<AuthedRoute component={Settings} exact path="/settings" />
				<AuthedRoute component={Settings} view={true} path="/settings/preferences" />
				<AuthedRoute component={Settings} view={true} path="/settings/feeds" />
				<AuthedRoute component={Settings} view={true} path="/settings/themes" />
				<AuthedRoute component={Settings} view={true} path="/settings/profile" />
				<AuthedRoute component={Settings} view={true} path="/settings/security" />
				<AuthedRoute component={Settings} view={true} path="/settings/delete-account" />
				<AuthedRoute component={Settings} view={true} path="/settings/opml" />
				<AuthedRoute component={Settings} view={true} path="/settings/helps" />
				<AuthedRoute component={Settings} view={true} path="/settings/history" />
				<AuthedRoute component={Settings} view={true} path="/settings/plans" />
				<AuthedRoute component={Settings} view={true} path="/settings/billing" />
				<AuthedRoute component={Settings} view={true} path="/settings/pay/success" />
				<AuthedRoute
					component={Settings}
					view={true}
					path="/settings/pay/:subscriptionId"
				/>
				<AuthedRoute component={Manages} exact path="/manages" />
				<AuthedRoute component={Manages} view={true} path="/manages/feeds" />
				<AuthedRoute component={Manages} view={true} path="/manages/articles" />
				<AuthedRoute component={Manages} view={true} path="/manages/accounts" />
				<AuthedRoute component={Manages} view={true} path="/manages/email" />
				<AuthedRoute component={Manages} view={true} path="/manages/totals" />
				<AuthedRoute component={Manages} view={true} path="/manages/blocklist" />
				<AuthedRoute component={Manages} view={true} path="/manages/monitoring" />
				<AuthedRoute component={Manages} view={true} path="/manages/plans" />
				<AuthedRoute component={Manages} view={true} path="/manages/transactions" />
				<UnauthedRoute component={Welcome} exact path="/welcome" />
				<UnauthedRoute component={Signin} exact path="/login" />
				<UnauthedRoute component={Signup} exact path="/signup" />
				<UnauthedRoute component={ForgotPassword} exact path="/forgot-password" />
				<UnauthedRoute component={ResetPassword} exact path="/reset-password" />
				<UnauthedRoute component={Share} redirect={false} exact path="/share/:shareId" />
				<Route component={NotFound} />
			</Switch>
			<AuthedRoute component={Player} redirect={false} />
		</div>
	);
};

export default AppRoute;
