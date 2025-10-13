import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';

export default function useDarkMode() {
	const autoTheme = 'auto';
	const lightTheme = 'light';
	const darkTheme = 'dark';
	const savedTheme = localStorage.getItem('theme');
	const [theme, setTheme] = useState(savedTheme || autoTheme);

	const systemPrefersDark = useMediaQuery(
		{
			query: '(prefers-color-scheme: dark)',
		},
		undefined,
		(prefersDark) => {
			setTheme(prefersDark ? darkTheme : lightTheme);
		},
	);

	useEffect(() => {
		const body = document.body;
		if (theme === autoTheme) {
			if (systemPrefersDark && !body.classList.contains(darkTheme)) {
				body.classList.add(darkTheme);
			} else {
				body.classList.remove(darkTheme);
			}
		}
		if (theme === darkTheme && !body.classList.contains(darkTheme)) {
			body.classList.add(darkTheme);
		}
		if (theme === lightTheme) {
			body.classList.remove(darkTheme);
		}
	}, [theme, systemPrefersDark]);

	return theme === 'auto' ? (systemPrefersDark ? darkTheme : lightTheme) : theme;
}
