import React from 'react';
import Select from 'react-select';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const ControllerSelect = ({
	control,
	name,
	options = [],
	defaultValue,
	placeholder,
	rules,
	disabled,
}) => {
	const { t } = useTranslation();

	return (
		<Controller
			name={name}
			rules={rules}
			control={control}
			defaultValue={defaultValue}
			render={({ onChange, value, ref }) => (
				<Select
					inputRef={ref}
					cacheOptions={true}
					defaultOptions={true}
					className="select-container"
					classNamePrefix="select"
					placeholder={placeholder || t('Select...')}
					options={options}
					onChange={(val) => onChange(val ? val.value : null)}
					value={options.find((o) => o.value === value)}
					isDisabled={disabled}
				/>
			)}
		/>
	);
};

export default ControllerSelect;
