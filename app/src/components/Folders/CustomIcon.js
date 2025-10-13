import React from 'react';

import { ReactComponent as FolderIcon } from '../../images/icons/folder-outline.svg';
import { ReactComponent as OpenFolderIcon } from '../../images/icons/folder-open-outline.svg';

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
		<OpenFolderIcon />
	) : (
		<FolderIcon />
	);
};

export default CustomIcon;
