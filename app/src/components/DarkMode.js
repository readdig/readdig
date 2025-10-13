import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';

const DarkMode = () => {
	const autoTheme = 'auto';
	const lightTheme = 'light';
	const darkTheme = 'dark';
	const savedTheme = localStorage.getItem('theme');
	const [theme, setTheme] = useState(savedTheme || autoTheme);
	const { t } = useTranslation();

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

	const switchTheme = (e) => {
		const value = e.target.value;
		if (value === autoTheme) {
			localStorage.setItem('theme', autoTheme);
			setTheme(autoTheme);
		}
		if (value === lightTheme) {
			localStorage.setItem('theme', lightTheme);
			setTheme(lightTheme);
		}
		if (value === darkTheme) {
			localStorage.setItem('theme', darkTheme);
			setTheme(darkTheme);
		}
	};

	return (
		<>
			<label>
				<input
					type="radio"
					name="theme"
					checked={theme === autoTheme}
					value="auto"
					onChange={switchTheme}
				/>
				<span>{t('Automatic')}</span>
			</label>
			<label>
				<input
					type="radio"
					name="theme"
					checked={theme === lightTheme}
					value="light"
					onChange={switchTheme}
				/>
				<span>{t('Light')}</span>
			</label>
			<label>
				<input
					type="radio"
					name="theme"
					checked={theme === darkTheme}
					value="dark"
					onChange={switchTheme}
				/>
				<span>{t('Dark')}</span>
			</label>
		</>
	);
};

export default DarkMode;
