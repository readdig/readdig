import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

function DebounceInput({ inputRef, onChange, ...rest }) {
	const debounced = useDebouncedCallback(
		(value) => {
			onChange(value);
		},
		// delay in ms
		600,
	);

	return <input {...rest} ref={inputRef} onChange={(e) => debounced(e.target.value)} />;
}

export default DebounceInput;
