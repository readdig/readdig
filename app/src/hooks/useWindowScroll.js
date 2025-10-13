import { useEffect } from 'react';

const validFocusableElements = ['INPUT', 'TEXTAREA'];

const disabledWindowScrolling = (e) => {
	e.preventDefault();
	window.scrollTo(0, 0);
};

const removeDisabledScrolling = (e) => {
	if (typeof e.target !== 'undefined' && typeof e.target.nodeName !== 'undefined') {
		if (validFocusableElements.indexOf(e.target.nodeName) !== -1) {
			window.removeEventListener('scroll', disabledWindowScrolling);
		}
	}
};

const addDisabledScrolling = (e) => {
	if (typeof e.target !== 'undefined' && typeof e.target.nodeName !== 'undefined') {
		if (validFocusableElements.indexOf(e.target.nodeName) !== -1) {
			window.addEventListener('scroll', disabledWindowScrolling);
		}
	}
};

const useWindowScroll = () => {
	useEffect(() => {
		window.addEventListener('scroll', disabledWindowScrolling);
		document.addEventListener('focus', removeDisabledScrolling, true);
		document.addEventListener('blur', addDisabledScrolling, true);

		return () => {
			window.removeEventListener('scroll', disabledWindowScrolling);
			document.removeEventListener('focus', removeDisabledScrolling, true);
			document.removeEventListener('blur', addDisabledScrolling, true);
		};
	}, []);
};

export default useWindowScroll;
