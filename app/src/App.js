import React from 'react';
import thunk from 'redux-thunk';
import { Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { createBrowserHistory } from 'history';
import { ToastContainer } from 'react-toastify';
import { I18nextProvider } from 'react-i18next';

import i18n from './locales';
import AppRoute from './AppRoute';
import reducer from './reducers';
import Updater from './components/Updater';
import useDarkMode from './hooks/useDarkMode';
import { getCurrentUser } from './utils/user';

const currentUser = getCurrentUser();
const menuIsOpen = localStorage['menuIsOpen'];
const folderIsOpen = localStorage['folderIsOpen'];
const initialState = {
	user: currentUser,
	menuIsOpen: menuIsOpen ? JSON.parse(menuIsOpen) : undefined,
	folderIsOpen: folderIsOpen ? JSON.parse(folderIsOpen) : undefined,
};

const history = createBrowserHistory();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
	reducer,
	initialState,
	composeEnhancers(applyMiddleware(thunk)),
);

const App = () => {
	const theme = useDarkMode();

	return (
		<Provider store={store}>
			<I18nextProvider i18n={i18n}>
				<Updater />
				<Router history={history}>
					<AppRoute />
				</Router>
				<ToastContainer position="top-center" theme={theme} />
			</I18nextProvider>
		</Provider>
	);
};

export default App;
