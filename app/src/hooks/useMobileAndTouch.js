import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';

const useMobileAndTouch = () => {
	const isMobileAndTouch = useMemo(() => {
		if (typeof window === 'undefined') return false;
		const navigatorMaxTouchPoints =
			typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
		const hasTouch = 'ontouchstart' in window || navigatorMaxTouchPoints > 0;
		return isMobile && window.innerWidth <= 1023 && hasTouch;
	}, []);

	return isMobileAndTouch;
};

export default useMobileAndTouch;
