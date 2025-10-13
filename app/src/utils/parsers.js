import { billingTypeOptions } from './options';

export const parseBillingType = (period, type) => {
	if (!period || !type) {
		return;
	}

	if (period > 1) {
		return `${period} ${
			billingTypeOptions.find((option) => option.value === type).label
		}s`;
	}

	return billingTypeOptions.find((option) => option.value === type).label;
};
