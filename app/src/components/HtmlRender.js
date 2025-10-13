import React, { useEffect, useState } from 'react';
import HTMLReactParser, { domToReact } from 'html-react-parser';
import { useSelector } from 'react-redux';

import { sanitizeHTML } from '../utils/sanitize';

const HtmlRender = ({ article, openModal }) => {
	const user = useSelector((state) => state.user || {});
	const textSize = parseInt((user.settings || {}).textSize || 0);
	const fontSize = 1 + textSize / 16;
	const lineHeight = 1.75 + textSize / 16;
	const textStyle =
		textSize > 0 ? { fontSize: fontSize + 'rem', lineHeight: lineHeight + 'rem' } : {};
	const url = article.url;
	const content = sanitizeHTML(article.content || article.description);
	const [html, setHtml] = useState();
	const [error, serError] = useState(false);

	useEffect(() => {
		setHtml(content);

		try {
			serError(false);
			const options = {
				replace: ({ type, name, attribs, children }) => {
					if (!attribs) {
						return;
					}

					if (type === 'tag' && name === 'a') {
						if (attribs.href && attribs.href.substr(0, 1) === '#') {
							attribs.target = '_self';
						} else if (
							attribs.href &&
							(attribs.href.substr(0, 4) === 'http' || attribs.href.substr(0, 2) === '//')
						) {
							attribs.target = '_blank';
						} else if (
							url &&
							attribs.href &&
							attribs.href.substr(0, 1) === '/' &&
							attribs.href.substr(0, 2) !== '//'
						) {
							const parsedUrl = new URL(url);
							const hostname = parsedUrl.protocol + '//' + parsedUrl.host;
							attribs.href = hostname + attribs.href;
							attribs.target = '_blank';
						} else {
							attribs.target = undefined;
							attribs.href = undefined;
						}
						return domToReact(children, options);
					}

					if (type === 'tag' && name === 'img') {
						if (
							url &&
							attribs.src &&
							attribs.src.substr(0, 1) === '/' &&
							attribs.src.substr(0, 2) !== '//'
						) {
							const parsedUrl = new URL(url);
							const hostname = parsedUrl.protocol + '//' + parsedUrl.host;
							attribs.src = hostname + attribs.src;
						}
						return (
							<img
								alt={attribs.alt}
								{...attribs}
								onClick={(e) => {
									e.stopPropagation();
									attribs.src && openModal(attribs);
								}}
								referrerPolicy="no-referrer"
							/>
						);
					}
				},
			};
			setHtml(HTMLReactParser(content, options));
		} catch (err) {
			serError(true);
		}
	}, [url, content, openModal]);

	return (
		<>
			{!error && (
				<div className="content" style={textStyle}>
					{html}
				</div>
			)}
			{error && (
				<div
					className="content"
					style={textStyle}
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			)}
		</>
	);
};

export default HtmlRender;
