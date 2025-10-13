import React from 'react';

import dayjs from '../utils/dayjs';

const TimeAgo = ({ value, trim = false, ...rest }) => {
	return (
		<time {...rest} title={dayjs(value).format('lll')}>
			{dayjs(value).fromNow(trim)}
		</time>
	);
};

export default TimeAgo;
