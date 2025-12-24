import React, { useState, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX } from '@tabler/icons-react';

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
				<IconX
					className="clickable"
					onClick={() => {
						setText('');
						onChange('');
					}}
				/>
			) : (
				<IconSearch />
			)}
		</div>
	);
};

export default SearchInput;
