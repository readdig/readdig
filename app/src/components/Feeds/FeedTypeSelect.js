import React from 'react';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

import { feedTypeOptions } from '../../utils/options';

const FeedTypeSelect = ({ value, placeholder, onChange }) => {
	const { t } = useTranslation();
	const options = feedTypeOptions.map(({ value, label }) => ({ value, label: t(label) }));

	return (
		<Select
			className="select-container"
			classNamePrefix="select"
			placeholder={placeholder || t('Select...')}
			isClearable={true}
			options={options}
			onChange={(val) => onChange(val ? val.value : null)}
			value={options.find((o) => o.value === value)}
		/>
	);
};

export default FeedTypeSelect;
