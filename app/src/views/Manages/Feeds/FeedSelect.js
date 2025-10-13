import React from 'react';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';

import {
	SearchIndicator,
	NoOptionsMessage,
	Option,
} from '../../../components/Feeds/FeedOption';
import { getFeeds } from '../../../api/feed';

const FeedSelect = ({ feedId, placeholder, onChange }) => {
	const { t } = useTranslation();

	const loadOptions = async (inputValue) => {
		const query = {
			q: encodeURIComponent(inputValue || ''),
			per_page: 8,
		};
		const res = await getFeeds(query);
		const data = res.data
			.filter((f) => f.id !== feedId)
			.map((f) => ({ value: f.id, label: f.title, feed: f }));
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
			components={{ DropdownIndicator: SearchIndicator, NoOptionsMessage, Option }}
			loadOptions={loadOptions}
			onChange={(val) => onChange(val ? val.value : null)}
		/>
	);
};

export default FeedSelect;
