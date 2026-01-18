import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AsyncSelect from 'react-select/async';

import { RSSIndicator, NoOptionsMessage, Option, Input } from './FeedOption';
import { search } from '../../api/search';

const FeedAutocomplete = ({ placeholder, onChange }) => {
	const [value, setValue] = useState();
	const [inputValue, setInputValue] = useState('');
	const follows = useSelector((state) => state.follows || {});

	const loadOptions = async (inputValue) => {
		if (!inputValue) return [];
		const res = await search(inputValue, { type: 'feeds' });
		const data = (res.data.feeds || []).map((f) => ({
			value: f.id,
			label: f.title,
			feed: f,
		}));
		return data;
	};

	const handleInputChange = (inputValue, { action }) => {
		if (action === 'input-change') {
			setInputValue(inputValue);
			onChange(inputValue ? { feedUrl: inputValue } : null);
		}
	};

	const handleChange = (option) => {
		setValue(option);
		setInputValue(option ? option.label : '');
		onChange(option ? { feedId: option.value } : null);
	};

	return (
		<AsyncSelect
			value={value}
			inputValue={inputValue}
			isClearable={true}
			cacheOptions={true}
			defaultOptions={true}
			className="select-container"
			classNamePrefix="select"
			placeholder={placeholder || ''}
			controlShouldRenderValue={false}
			components={{ DropdownIndicator: RSSIndicator, NoOptionsMessage, Option, Input }}
			loadOptions={loadOptions}
			onInputChange={handleInputChange}
			onChange={handleChange}
			isOptionDisabled={(option) => follows[option.value]}
		/>
	);
};

export default FeedAutocomplete;
