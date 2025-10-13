import React, { useEffect, useState } from 'react';
import { Range, getTrackBackground } from 'react-range';

const STEP = 1;
const MIN = 0;
const MAX = 6;

const FontSize = (props) => {
	const [value, setValue] = useState(0);

	useEffect(() => {
		setValue(props.value || 0);
	}, [props.value]);

	const onChange = (values) => {
		setValue(values[0]);
		if (props.onChange !== undefined) {
			props.onChange(values[0] || 0);
		}
	};

	return (
		<div className="font-size-range">
			<Range
				values={[value]}
				step={STEP}
				min={MIN}
				max={MAX}
				onChange={onChange}
				renderMark={({ props, index }) => (
					<div
						{...props}
						style={{
							...props.style,
							height: '16px',
							width: '5px',
							backgroundColor: index * STEP < value ? '#548BF4' : '#ccc',
						}}
					/>
				)}
				renderTrack={({ props, children }) => (
					<div
						onMouseDown={props.onMouseDown}
						onTouchStart={props.onTouchStart}
						style={{
							...props.style,
							height: '36px',
							display: 'flex',
							width: '100%',
						}}
					>
						<div
							ref={props.ref}
							style={{
								height: '5px',
								width: '100%',
								borderRadius: '4px',
								background: getTrackBackground({
									values: [value],
									colors: ['#548BF4', '#ccc'],
									min: MIN,
									max: MAX,
								}),
								alignSelf: 'center',
							}}
						>
							{children}
						</div>
					</div>
				)}
				renderThumb={({ props, isDragged }) => (
					<div
						{...props}
						style={{
							...props.style,
							height: '42px',
							width: '42px',
							borderRadius: '4px',
							backgroundColor: '#fff',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							boxShadow: '0px 2px 6px #AAA',
						}}
					>
						<div
							style={{
								height: '16px',
								width: '5px',
								backgroundColor: isDragged ? '#548BF4' : '#CCC',
							}}
						/>
					</div>
				)}
			/>
		</div>
	);
};

export default FontSize;
