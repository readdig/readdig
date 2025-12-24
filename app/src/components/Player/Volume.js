import React, { useState } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';

const Volume = ({ value, onChange }) => {
	const [values, setValues] = useState([value || 0.3]);

	return (
		<>
			{value === 0 ? <IconVolumeOff /> : <IconVolume />}
			<Range
				min={0}
				max={1}
				step={0.001}
				values={values}
				onChange={(values) => {
					setValues(values);
					if (onChange) {
						onChange(values[0] || 0);
					}
				}}
				renderTrack={({ props, children }) => (
					<div
						onMouseDown={props.onMouseDown}
						onTouchStart={props.onTouchStart}
						style={{
							...props.style,
							display: 'flex',
							width: '120px',
						}}
					>
						<div
							ref={props.ref}
							style={{
								height: '6px',
								width: '100%',
								borderRadius: '50px',
								background: getTrackBackground({
									values: values,
									colors: ['#aaa', '#ccc'],
									min: 0,
									max: 1,
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
							height: '20px',
							width: '8px',
							borderRadius: '50px',
							backgroundColor: '#fff',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<div
							style={{
								height: '20px',
								width: '8px',
								borderRadius: '50px',
								backgroundColor: isDragged ? '#aaa' : '#ccc',
							}}
						/>
					</div>
				)}
			/>
		</>
	);
};

export default Volume;
