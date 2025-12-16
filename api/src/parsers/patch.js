import strip from 'strip';
import { Parser } from 'htmlparser2';

import computeHash from '../utils/hash';
import { extractHostname, normalizeUrl, resolveUrl, isRelativeUrl } from '../utils/urls';
import { DetectLanguage } from './detect-language';

function parseImage(html) {
	if (!html) {
		return null;
	}

	// 1. Try BBCode [img]...[/img]
	if (html.includes('[img]')) {
		const bbcodeRe = /\[img\](.*?)\[\/img\]/im;
		const matches = bbcodeRe.exec(html);
		if (matches) {
			return matches[1];
		}
	}

	// 2. Try HTML <img> tag using htmlparser2
	let imgSrc = null;
	const parser = new Parser({
		onopentag(name, attributes) {
			if (!imgSrc && name === 'img' && attributes.src) {
				imgSrc = attributes.src;
				parser.reset();
			}
		},
	});
	parser.write(html);
	parser.end();

	return imgSrc;
}

export const FeedContentMakeUp = (posts, feedContent) => {
	if (!posts && !feedContent) {
		return;
	}

	// fix title and description
	if (feedContent.title === 'null' || feedContent.title === 'undefined') {
		feedContent.title = '';
	}

	if (feedContent.description === 'null' || feedContent.description === 'undefined') {
		feedContent.description = '';
	}

	if (!feedContent.title && feedContent.description) {
		feedContent.title = feedContent.description;
	}

	// fix geekpark.net url error
	if (feedContent.url && feedContent.url.includes('main_test.geekpark.net/rss.rss')) {
		feedContent.url = 'https://www.geekpark.net';
	}

	// fix feed type
	const isPodcast = feedContent.items.slice(0, 10).every((feed) => {
		return (
			feed.attachments.length &&
			feed.attachments[0].mimeType &&
			feed.attachments[0].mimeType.includes('audio')
		);
	});
	feedContent.type = isPodcast ? 'podcast' : 'rss';

	// fix language
	feedContent.language = DetectLanguage(feedContent);

	return feedContent;
};

export const FeedArticleMakeUp = (post, article) => {
	if (!post && !article) {
		return;
	}

	// fix content '-'
	if (article.content.startsWith('-')) {
		article.content = article.content.substring(1);
	}

	// fix content '<br><br>'
	if (article.content.startsWith('<br><br>')) {
		article.content = article.content.substring(8);
	}

	if (
		post['rss:description'] &&
		post['rss:description']['#'] &&
		post['rss:description']['#'] !== article.content
	) {
		article.content = post['rss:description']['#'];
	}

	// fix image
	if (!article.image && post['rss:thumbnail'] && post['rss:thumbnail']['#']) {
		article.image = post['rss:thumbnail']['#'];
	}

	if (!article.image && article.content) {
		article.image = parseImage(article.content);
	}

	// nice images for XKCD
	if (post.link && post.link.startsWith('https://xkcd')) {
		const matches = article.content.match(/(https:\/\/imgs.xkcd.com\/comics\/.*?)"/);
		if (matches && matches.length) {
			article.image = matches[1];
		}
	}

	if (article.image) {
		if (article.url && isRelativeUrl(article.image)) {
			const hostname = extractHostname(article.url);
			article.image = resolveUrl(hostname, article.image);
		} else {
			article.image = normalizeUrl(article.image);
		}

		// fix hackernoon thumbnail url bug
		if (article.image.startsWith('https://hackernoon.com/https://')) {
			article.image = article.image.replace(/^https\:\/\/hackernoon\.com\/+/, '');
		}
	}

	// fix enclosure
	if (post.enclosures) {
		post.enclosures.map((enclosure) => {
			if (!enclosure.url && post['media:thumbnail'] && post['media:thumbnail']['@'].url) {
				enclosure.url = post['media:thumbnail']['@'].url;
			}

			let duration = 0;
			if (post['itunes:duration']) {
				duration = post['itunes:duration']['#'];
				const time = duration.split(':');
				if (time.length === 3) {
					duration =
						parseInt(time[0]) * 60 * 60 + parseInt(time[1]) * 60 + parseInt(time[2]);
				}
				if (time.length === 2) {
					duration = parseInt(time[0]) * 60 * 60 + parseInt(time[1]) * 60;
				}
			}

			if (enclosure.type === 'text/html' && enclosure.url.endsWith('.m4a')) {
				enclosure.type = 'audio/x-m4a';
			}

			if (
				!article.image &&
				enclosure.url &&
				enclosure.type &&
				enclosure.type.toLowerCase().includes('image')
			) {
				article.image = enclosure.url;
			}

			if (
				post.image &&
				post.image.url &&
				post.image.title &&
				enclosure.url &&
				enclosure.url === post.image.url
			) {
				enclosure.title = post.image.title;
			}

			if (enclosure.url && enclosure.url.trim()) {
				const urlExists = article.attachments.some(a => a.url === enclosure.url);
				if (!urlExists) {
					article.attachments.push({
						url: enclosure.url,
						title: enclosure.title,
						mimeType: enclosure.type,
						sizeInBytes: enclosure.length ? parseInt(enclosure.length) : 0,
						durationInSeconds: duration ? parseInt(duration) : 0,
					});
				}
			}
		});
	}

	// fix thumbnail
	if (post['rss:thumbnail'] && post['rss:thumbnail']['#']) {
		const thumbnailUrl = post['rss:thumbnail']['#'];
		if (thumbnailUrl && thumbnailUrl.trim()) {
			const urlExists = article.attachments.some(a => a.url === thumbnailUrl);
			if (!urlExists) {
				article.attachments.push({ url: thumbnailUrl });
			}
		}
	}

	// fix youtube
	if (post['yt:videoid']) {
		const youtubeId = post['yt:videoid']['#'];
		if (youtubeId && youtubeId.trim()) {
			const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
			const urlExists = article.attachments.some(a => a.url === youtubeUrl);
			if (!urlExists) {
				article.attachments.push({
					mimeType: 'youtube',
					title: post['media:group']['media:title']['#'],
					url: youtubeUrl,
				});
			}
		}
		if (post['media:group'] && !article.summary) {
			const description = post['media:group']['media:description']['#'];
			const summary = strip(description || '').substring(0, 200);
			article.summary = summary;
		}
		if (post['media:group'] && !article.content) {
			const description = post['media:group']['media:description']['#'];
			article.content = description || '';
		}
		if (post['media:group'] && !article.image) {
			article.image = post['media:group']['media:thumbnail']['@']['url'];
		}
		if (post['atom:author']['uri'] && !article.author.url) {
			article.author.url = post['atom:author']['uri']['#'];
		}
	}

	// fix youtube
	if (
		post.link &&
		post.link.trim() &&
		!post['yt:videoid'] &&
		/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/.test(post.link)
	) {
		const urlExists = article.attachments.some(a => a.url === post.link);
		if (!urlExists) {
			article.attachments.push({
				url: post.link,
				mimeType: 'youtube',
			});
		}
	}

	// fix tiktok
	if (post.link && post.link.trim() && /tiktok\.com\/@[^/]+\/video\/\d+/.test(post.link)) {
		const urlExists = article.attachments.some(a => a.url === post.link);
		if (!urlExists) {
			article.attachments.push({
				url: post.link,
				mimeType: 'tiktok',
			});
		}
	}

	// fix attachments size_in_bytes
	if (post.attachments) {
		post.attachments.map((attachment) => {
			if (!attachment.url || !attachment.url.trim()) {
				return;
			}
			const urlExists = article.attachments.some(a => a.url === attachment.url);
			if (urlExists) {
				return;
			}
			let sizeInBytes = attachment.size_in_bytes;
			if (sizeInBytes && sizeInBytes['0']) {
				sizeInBytes = sizeInBytes['0'];
			}
			const durationInSeconds = attachment.duration_in_seconds;
			article.attachments.push({
				url: attachment.url,
				mimeType: attachment.mime_type,
				sizeInBytes: sizeInBytes && parseInt(sizeInBytes),
				durationInSeconds: durationInSeconds && parseInt(durationInSeconds),
			});
		});
	}

	if (post.guid) {
		// fix 36kr.com GUID bug
		if (
			post.guid.startsWith('http://www.36kr.com/') ||
			post.guid.startsWith('https://www.36kr.com/')
		) {
			const guid = post.guid.replace('//www.36kr.com/', '//36kr.com/');
			article.id = guid;
			article.guid = guid;
			article.url = guid;
		}
		// fix tmtpost.com GUID bug
		if (
			post.guid.startsWith('http://www.tmtpost.com/') ||
			post.guid.startsWith('https://www.tmtpost.com/')
		) {
			const guid = normalizeUrl(post.guid, {
				removeQueryParameters: ['rss'],
			});
			article.id = guid;
			article.guid = guid;
			article.url = guid;
		}
	} else {
		if (article.url) {
			const guid = computeHash(article.url);
			article.id = guid;
			article.guid = guid;
		} else {
			const attachmentUrls = article.attachments.map((a) => a.url);
			const attachmentString = attachmentUrls.join(',') || '';
			const data = `${article.title}:${attachmentString}`;
			const guid = computeHash(data);
			article.id = guid;
			article.guid = guid;
		}
	}

	return article;
};
