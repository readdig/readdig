import React from 'react';

import { ReactComponent as InclusiveIcon } from '../images/icons/all-inclusive.svg';

const Total = ({ value = 0, title = '' }) => {
	const val = parseInt(value || 0);
	const limit = 10000;

	if (val >= limit) {
		return (
			<div className="count" title={`${title}1w+`}>
				<InclusiveIcon />
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
