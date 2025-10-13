import contentType from 'content-type';

export default (input) => {
	try {
		if (input && input.trim().endsWith(';')) {
			input = input.replace(';', '');
		}
		const obj = contentType.parse(input);
		return obj;
	} catch {
		return;
	}
};
