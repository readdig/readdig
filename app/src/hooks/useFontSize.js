import { useEffect } from 'react';
import { useSelector } from 'react-redux';

const useFontSize = () => {
	const user = useSelector((state) => state.user || {});
	const fontSize = parseInt((user.settings || {}).fontSize || 0);

	useEffect(() => {
		if (fontSize) {
			const html = document.documentElement;
			html.style.fontSize = `${16 + fontSize}px`;

			return () => {
				html.removeAttribute('style');
			};
		}
	}, [fontSize]);
};

export default useFontSize;
