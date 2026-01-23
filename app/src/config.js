const config = {
	env: process.env.NODE_ENV || 'development',
	name: process.env.REACT_APP_NAME,
	version: process.env.REACT_APP_VERSION,
	product: {
		url: process.env.REACT_APP_PRODUCT_URL,
		name: process.env.REACT_APP_PRODUCT_NAME,
	},
	api: {
		url: process.env.REACT_APP_API_URL,
	},
	sentry: {
		dsn: process.env.REACT_APP_SENTRY_DSN,
	},
	paddle: {
		vendorId: process.env.REACT_APP_PADDLE_VENDOR_ID,
	},
	freeMode: process.env.REACT_APP_FREE_MODE !== 'false',
};

export default config;
