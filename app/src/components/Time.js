import React from 'react';
import dayjs from '../utils/dayjs';

const Time = ({ value, format = 'lll', ...rest }) => {
	const datetime = dayjs(value).format(format);
	return (
		<time {...rest} title={datetime}>
			{datetime}
		</time>
	);
};

export default Time;
