import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import { getCurrentUser } from './utils/user';

const UnauthedRoute = ({ component: Component, redirect = true, ...rest }) => {
	const user = getCurrentUser();
	const isLoggedin = user && user.id;

	return (
		<Route
			{...rest}
			render={(props) => {
				if (isLoggedin && redirect) {
					return <Redirect to="/" />;
				} else {
					return <Component {...props} />;
				}
			}}
		/>
	);
};

export default UnauthedRoute;
