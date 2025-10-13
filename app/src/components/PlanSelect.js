import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { components } from 'react-select';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getPlans } from '../api/subscription';

const NoOptionsMessage = (props) => {
	const { t } = useTranslation();

	return (
		<components.NoOptionsMessage {...props}>
			{t('No plans found')}
		</components.NoOptionsMessage>
	);
};

const PlanSelect = ({ control, name, defaultValue, placeholder, rules, disabled }) => {
	const { t } = useTranslation();
	const [options, setOptions] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const res = await getPlans();
			const arr = res.data.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` }));
			setOptions(arr);
		};

		fetchData();
	}, []);

	return (
		<Controller
			name={name}
			rules={rules}
			control={control}
			defaultValue={defaultValue}
			render={({ onChange, value, ref }) => (
				<Select
					inputRef={ref}
					className="select-container"
					classNamePrefix="select"
					placeholder={placeholder || t('Select...')}
					isClearable={true}
					cacheOptions={true}
					defaultOptions={true}
					components={{ NoOptionsMessage }}
					options={options}
					isDisabled={disabled}
					onChange={(val) => onChange(val ? val.value : null)}
					value={value && options.find((o) => o.value.toString() === value.toString())}
				/>
			)}
		/>
	);
};

export default PlanSelect;
