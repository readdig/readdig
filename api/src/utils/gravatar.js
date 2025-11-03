import gravatar from 'gravatar';

import { config } from '../config';

export default (email) => {
	return gravatar.url(email, {
		s: '200',
		d: 'identicon',
		cdn: config.gravatar.cdn,
	});
};
