import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

const previewScrolling = (e) => {
	const scrollTop = e.target.scrollTop;
	const header = document.querySelector('.app >.header');

	if (scrollTop > 100) {
		header.classList.add('hidden');
	}

	if (scrollTop <= 0) {
		header.classList.remove('hidden');
	}
};

export default function useScrollHiddenTop() {
	useEffect(() => {
		if (isMobile) {
			document
				.getElementById('scrollablePreview')
				.addEventListener('scroll', previewScrolling);
			return () => {
				document
					.getElementById('scrollablePreview')
					.removeEventListener('scroll', previewScrolling);
			};
		}
	}, []);
}
