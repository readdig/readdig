module.exports = {
	database: {
		url: process.env.DATABASE_URL,
	},
	cache: {
		url: 'redis://localhost:6379/10',
	},
	email: {
		backend: 'dummy',
		sender: {
			support: {
				name: process.env.EMAIL_SENDER_SUPPORT_NAME,
				email: process.env.EMAIL_SENDER_SUPPORT_EMAIL,
			},
		},
		sendgrid: {
			secret: process.env.EMAIL_SENDGRID_SECRET,
		},
	},
};
