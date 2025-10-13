import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import './styles/global.scss';

import App from './App';
import config from './config';
import * as serviceWorker from './serviceWorkerRegistration';
import { onServiceWorkerUpdate } from '@3m1/service-worker-updater';

Sentry.init({
	dsn: config.sentry.dsn,
	environment: config.env,
	release: `${config.name}@${config.version}`,
	integrations: [new Integrations.BrowserTracing()],
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorker.unregister();
serviceWorker.register({
	onUpdate: onServiceWorkerUpdate,
});
