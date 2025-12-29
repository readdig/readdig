import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { IconSparkles } from '@tabler/icons-react';
import * as TablerIcons from '@tabler/icons-react';

import { getCategories } from '../../api/category';

// Helper to render tabler icon by name
const renderTablerIcon = (iconName, size = 18, color = null) => {
	const IconComponent = TablerIcons[iconName];
	if (!IconComponent) return null;
	return <IconComponent size={size} stroke={1.5} color={color} />;
};

const CategoryList = ({ value, onChange }) => {
	const { t } = useTranslation();
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setLoading(true);
				const res = await getCategories();
				setCategories(res.data);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};
		fetchCategories();
	}, []);

	if (loading || categories.length === 0) {
		return null;
	}

	return (
		<div className="category-list">
			<button
				className={classNames('btn', 'category-item', { active: !value })}
				onClick={() => onChange(null)}
			>
				<div className="icon-wrapper">
					<IconSparkles color="#f59e0b" />
				</div>
				<span className="name">{t('Recommended')}</span>
			</button>
			{categories.map((cat) => (
				<button
					key={cat.id}
					className={classNames('btn', 'category-item', { active: value === cat.id })}
					onClick={() => onChange(cat.id)}
					title={cat.description || cat.name}
				>
					<div className="icon-wrapper">
						{cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
							<img src={cat.icon} alt={cat.name} />
						) : cat.icon && cat.icon.startsWith('Icon') ? (
							renderTablerIcon(cat.icon, 18, cat.color)
						) : cat.icon ? (
							<span style={{ fontSize: '1rem', lineHeight: 1 }}>{cat.icon}</span>
						) : (
							<IconSparkles />
						)}
					</div>
					<span className="name">{cat.name}</span>
				</button>
			))}
		</div>
	);
};

export default CategoryList;
