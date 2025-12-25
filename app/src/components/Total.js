import React from 'react';

const Total = ({ value = 0, className }) => {
	const val = parseInt(value || 0);

	const formatValue = () => {
		if (val >= 100000) {
			return (
				<>
					10
					<span className="unit">w+</span>
				</>
			);
		} else if (val >= 10000) {
			const num = (val / 10000).toFixed(1).replace('.0', '');
			return (
				<>
					{num}
					<span className="unit">w+</span>
				</>
			);
		} else if (val >= 1000) {
			const num = (val / 1000).toFixed(1).replace('.0', '');
			return (
				<>
					{num}
					<span className="unit">k+</span>
				</>
			);
		}
		return val > 0 ? val : '';
	};

	return <span className={className}>{formatValue()}</span>;
};

export default Total;
