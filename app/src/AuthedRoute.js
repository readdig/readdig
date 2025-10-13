import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';

import { getCurrentUser } from './utils/user';

const AuthedRoute = ({
	view = false,
	redirect = true,
	component: Component,
	...rest
}) => {
	const user = getCurrentUser();
	const isLoggedin = user && user.id;

	useEffect(() => {
		if (view) {
			const el = document.querySelector('.app');
			if (el && el.classList) {
				el.classList.add('view');

				return () => {
					el.classList.remove('view');
				};
			}
		}
	}, [view]);

	return (
		<Route
			{...rest}
			render={(props) => {
				if (isLoggedin) {
					return <Component {...props} />;
				} else {
					if (redirect) {
						return <Redirect to="/welcome" />;
					}
					return false;
				}
			}}
		/>
	);
};

export default AuthedRoute;
