import sanitizeHtml from 'sanitize-html';

const allowedTags = [
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'p',
	'a',
	'ul',
	'ol',
	'nl',
	'li',
	'blockquote',
	'code',
	'table',
	'thead',
	'caption',
	'tbody',
	'tr',
	'th',
	'td',
	'pre',
	'figcaption',
	'b',
	'br',
	'i',
	'strong',
	'em',
	'strike',
	'img',
	'video',
	'source',
	'iframe',
	'figure',
];

const options = {
	allowedIframeHostnames: false,
	allowedTags,
	allowedAttributes: {
		a: ['href', 'target', 'id'],
		img: ['src', 'title', 'alt', 'width', 'height', 'height'],
		video: ['src', 'poster', 'type', 'controls', 'width', 'height'],
		source: ['src', 'type'],
		iframe: [
			'src',
			'type',
			'width',
			'height',
			'border',
			'frameborder',
			'framespacing',
			'allow',
			'scrolling',
			'allowfullscreen',
		],
		figure: ['draggable', 'contenteditable'],
	},
	allowedSchemesAppliedToAttributes: ['style'],
};

export const sanitizeHTML = (dirty) => {
	if (dirty) {
		const html = sanitizeHtml(dirty, options);
		return html;
	}
	return;
};

export const cleanHTML = (dirty) => {
	let html = dirty;
	if (html === ' ' || html === '&nbsp;') {
		html = '';
	} else {
		html = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
	}
	return html;
};
