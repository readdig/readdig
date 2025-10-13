import React from 'react';

import Image from '../Image';

const Avatar = ({ width = 28, height = 28, title, avatarUrl, children, onClick }) => {
	return (
		<div className="avatar" onClick={onClick}>
			<Image alt={title} width={width} height={height} src={avatarUrl} />
			{children}
		</div>
	);
};

export default Avatar;
