import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import config from '../config';

const Image = ({ relative = false, src, alt }) => {
	return (
		<LazyLoadImage
			alt={alt}
			title={alt}
			src={`${relative ? config.api.url : ''}${src}`}
			placeholder={<div className="placeholder" title={alt} />}
		/>
	);
};

export default Image;
