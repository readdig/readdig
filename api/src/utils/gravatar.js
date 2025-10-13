import gravatar from 'gravatar';

export default (email) => {
	return gravatar.url(email, {
		s: '200',
		d: 'identicon',
	});
};
