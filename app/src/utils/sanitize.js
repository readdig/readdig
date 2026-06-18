import sanitizeHtml from 'sanitize-html';
import bbobHTML from '@bbob/html';
import presetHTML5 from '@bbob/preset-html5';

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
	// Structural tags used by Discourse rich content (linux.do): onebox link
	// preview cards (<aside><header><article>), image lightboxes (<div>) and
	// inline wrappers (<span>) for mentions/emoji.
	'aside',
	'header',
	'article',
	'div',
	'span',
];

// Only these class values survive sanitization — the specific classes used by
// Discourse rich content (linux.do) that we style. Allowing the `class`
// attribute wholesale would let an untrusted feed reuse the app's own class
// names (e.g. `.modal-overlay`, a fixed full-screen z-indexed layer) to overlay
// the UI for clickjacking/phishing, so the class *values* are whitelisted here.
const allowedClasses = [
	'onebox',
	'onebox-body',
	'onebox-metadata',
	'source',
	'site-icon',
	'lightbox-wrapper',
	'lightbox',
	'meta',
	'emoji',
	'mention',
	'inline-onebox',
];

const options = {
	allowedIframeHostnames: false,
	allowedTags,
	allowedAttributes: {
		a: ['href', 'target', 'rel', 'id'],
		img: ['src', 'title', 'alt', 'width', 'height', 'height', 'data-original'],
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
	// Whitelist class values (not the bare `class` attribute) — see above.
	allowedClasses: { '*': allowedClasses },
	allowedSchemesAppliedToAttributes: ['style'],
};

// Pretty-printed HTML (e.g. Discourse content from linux.do) has a newline
// between many tags. The renderer turns newlines into <br> below, so those
// structural newlines would each become a stray <br>, inflating the markup
// (onebox cards, double-spaced text). Strip the cosmetic newlines before that
// conversion: collapse whitespace that is purely between tags, and drop the
// newline that follows a <br> (the break is already rendered). Real text and
// newlines inside <pre>/<code> match neither pattern, so they're preserved.
// Plain-text feeds have no tags, so this is a no-op for them.
const collapseStructuralNewlines = (html) =>
	html.replace(/>\s*\n\s*</g, '><').replace(/(<br\s*\/?>)[ \t]*\n[ \t]*/gi, '$1');

// Convert BBCode to HTML using @bbob/html
const convertBBCode = (text) => {
	return bbobHTML(text, presetHTML5());
};

export const sanitizeHTML = (dirty) => {
	if (dirty) {
		const converted = collapseStructuralNewlines(convertBBCode(dirty));
		const html = sanitizeHtml(converted.replace(/\r?\n/g, '<br>'), options);
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
