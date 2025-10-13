import React from 'react';
import { Helmet } from 'react-helmet';
import { useMediaQuery } from 'react-responsive';

import config from '../config';

const PageTitle = ({ title }) => {
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1023px)' });

	return (
		<Helmet
			onChangeClientState={() => {
				const element = document.querySelector('.app >.header >.middle >.title');
				if (isTabletOrMobile && element) {
					element.textContent = title;
				}
			}}
		>
			{title ? (
				<title>{`${title} - ${config.product.name}`}</title>
			) : (
				<title>{config.product.name}</title>
			)}
		</Helmet>
	);
};

export default PageTitle;
