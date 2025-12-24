import React from 'react';
import { IconInfinity } from '@tabler/icons-react';

const Total = ({ value = 0, title = '' }) => {
	const val = parseInt(value || 0);
	const limit = 10000;

	if (val >= limit) {
		return (
			<div className="count" title={`${title}1w+`}>
				<IconInfinity />
			</div>
		);
	} else {
		return (
			<div className="count" title={`${title}${val}`}>
				{val}
			</div>
		);
	}
};

export default Total;
