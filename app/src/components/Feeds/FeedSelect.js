import React from 'react';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';

import { SearchIndicator, NoOptionsMessage, Option } from './FeedOption';
import { getFollowFeeds } from '../../api/follow';

const FeedSelect = ({ value, placeholder, onChange }) => {
	const { t } = useTranslation();

	const loadOptions = async (inputValue) => {
		const query = { title: encodeURIComponent(inputValue || ''), per_page: 8 };
		const res = await getFollowFeeds(query);
		const data = res.data.map((f) => ({ value: f.id, label: f.title, feed: f }));
		return data;
	};

	return (
		<AsyncSelect
			isMulti
			className="select-container"
			classNamePrefix="select"
			placeholder={placeholder || t('Select...')}
			cacheOptions={true}
			defaultOptions={true}
			value={value}
			components={{ DropdownIndicator: SearchIndicator, NoOptionsMessage, Option }}
			loadOptions={loadOptions}
			onChange={(val) => onChange(val ? val.map((s) => s.feed) : null)}
		/>
	);
};

export default FeedSelect;
