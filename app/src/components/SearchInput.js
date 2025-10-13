import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { ReactComponent as SearchIcon } from '../images/icons/magnify.svg';
import { ReactComponent as CloseIcon } from '../images/icons/close.svg';

const SearchInput = ({ value, delay = 400, inputRef, onChange, onBlur, ...rest }) => {
	const [text, setText] = useState(value || '');

	useEffect(() => {
		setText(value || '');
	}, [value]);

	const debounced = useDebouncedCallback(
		(value) => {
			onChange(value);
		},
		// delay in ms
		delay,
	);

	return (
		<div className="search-input">
			<input
				{...rest}
				ref={inputRef}
				value={text}
				onBlur={onBlur}
				onChange={(e) => {
					setText(e.target.value);
					debounced(e.target.value);
				}}
			/>
			{text ? (
				<CloseIcon
					className="clickable"
					onClick={() => {
						setText('');
						onChange('');
					}}
				/>
			) : (
				<SearchIcon />
			)}
		</div>
	);
};

export default SearchInput;
