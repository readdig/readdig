import React from 'react';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

import { languageOptions } from '../utils/options';

const LanguageSelect = ({ value, placeholder, onChange }) => {
	const { t } = useTranslation();

	return (
		<Select
			className="select-container"
			classNamePrefix="select"
			placeholder={placeholder || t('Select...')}
			isClearable={false}
			options={languageOptions}
			onChange={(val) => onChange(val ? val.value : null)}
			value={languageOptions.find((f) => f.value === value) || languageOptions[0]}
		/>
	);
};

export default LanguageSelect;
