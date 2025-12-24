import React from 'react';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import { useTranslation } from 'react-i18next';
import { IconSearch } from '@tabler/icons-react';

import { getFolders } from '../../api/folder';

const DropdownIndicator = (props) => {
	return (
		<components.DropdownIndicator {...props}>
			<IconSearch />
		</components.DropdownIndicator>
	);
};

const NoOptionsMessage = (props) => {
	const { t } = useTranslation();
	return (
		<components.NoOptionsMessage {...props}>
			{t('No folders found')}
		</components.NoOptionsMessage>
	);
};

const FolderSelect = ({ value, placeholder, onChange }) => {
	const { t } = useTranslation();

	const loadOptions = async (inputValue) => {
		const query = { name: encodeURIComponent(inputValue || ''), per_page: 8 };
		const res = await getFolders(query);
		const data = res.data.map((f) => ({ value: f.id, label: f.name }));
		return data;
	};

	return (
		<AsyncSelect
			className="select-container"
			classNamePrefix="select"
			placeholder={placeholder || t('Select...')}
			isClearable={true}
			cacheOptions={true}
			defaultOptions={true}
			value={value}
			components={{ DropdownIndicator, NoOptionsMessage }}
			loadOptions={loadOptions}
			onChange={onChange}
		/>
	);
};

export default FolderSelect;
