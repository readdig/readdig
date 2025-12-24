import React from 'react';
import { IconFolder, IconFolderOpen } from '@tabler/icons-react';

const ImageDownIcon = ({ src }) => {
	return (
		<div className="custom-icon arrow-down">
			<img src={src} alt="" />
		</div>
	);
};

const ImageRightIcon = ({ src }) => {
	return (
		<div className="custom-icon arrow-right">
			<img src={src} alt="" />
		</div>
	);
};

const CustomIcon = ({ isOpen = false, src }) => {
	return src ? (
		isOpen ? (
			<ImageDownIcon src={src} />
		) : (
			<ImageRightIcon src={src} />
		)
	) : isOpen ? (
		<IconFolderOpen />
	) : (
		<IconFolder />
	);
};

export default CustomIcon;
