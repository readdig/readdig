import dayjs from 'dayjs';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './resources/en.json';
import cn from './resources/zh-cn.json';

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.on('languageChanged', (lng) => {
		dayjs.locale(lng);
		document.documentElement.setAttribute('lang', lng);
	})
	.init({
		resources: {
			en: {
				translation: en,
			},
			'zh-cn': {
				translation: cn,
			},
		},
		fallbackLng: 'en',
		debug: false,
		lowerCaseLng: true,
		cleanCode: true,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			lookupQuerystring: 'lng',
			lookupCookie: 'lng',
			lookupLocalStorage: 'lng',
			lookupSessionStorage: 'lng',
		},
	});

export default i18n;
