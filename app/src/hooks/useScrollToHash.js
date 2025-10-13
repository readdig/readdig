import { useEffect } from 'react';

export default function useScrollToHash() {
	useEffect(() => {
		//TODO: setTimeout with 0 made it work in Safari - i dont know why
		setTimeout(() => {
			const { hash } = window.location;
			if (hash) {
				const id = hash.replace('#', '');
				const element = document.getElementById(id);
				if (element) {
					element.scrollIntoView({ block: 'start', behavior: 'smooth' });
				}
			}
		}, 100);
	}, []);
}
