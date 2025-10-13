import React from 'react';
import { useTranslation } from 'react-i18next';

const Holdable = ({ isOpen, className, onClick, children }) => {
	const { t } = useTranslation();

	return (
		<div
			className={className}
			title={isOpen ? t('Click collapse') : t('Click expand')}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick && onClick(e);
			}}
		>
			{children}
		</div>
	);
};

export default Holdable;
