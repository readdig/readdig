import franc from 'franc-min';

// DetectLanguage returns the language for the given feed content
export function DetectLanguage(feedContent) {
	let language = 'eng';
	if (!feedContent || !feedContent.items.length) {
		return language;
	}

	// guess the language using franc
	let languageSums = {};
	for (let item of feedContent.items.slice(0, 20)) {
		let languageVector = franc.all(`${item.title} ${item.summary}`);
		for (let [language, score] of languageVector) {
			if (!(language in languageSums)) {
				languageSums[language] = 0;
			}
			languageSums[language] += score;
		}
	}

	// see which language has the highest score
	let languages = Object.entries(languageSums).sort((a, b) => b[1] - a[1]);
	if (languages) {
		language = languages[0][0];
	}

	return language;
}
