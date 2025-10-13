import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { useTranslation } from 'react-i18next';

import Time from '../Time';
import Image from '../Image';
import Lightbox from '../Lightbox';
import HtmlRender from '../HtmlRender';
import PlayOrPause from './PlayOrPause';

const ArticleContent = ({ article = {} }) => {
	const { t } = useTranslation();
	const [imageAttribs, setImageAttribs] = useState();
	const [modalIsOpen, setModalIsOpen] = useState(false);
	const playable =
		article && article.type === 'episode' && article.feed.type === 'podcast';

	const openModal = (attribs) => {
		setImageAttribs(attribs);
		setModalIsOpen(true);
	};

	const closeModal = () => {
		setImageAttribs();
		setModalIsOpen(false);
	};

	return (
		<div className="article-content">
			<div className="title">
				{playable && (
					<div className="icon">
						<Image relative={true} src={`/images/article/${article.id}?w=120&h=120`} />
						<PlayOrPause article={article} />
					</div>
				)}
				<h1>{article.title}</h1>
			</div>
			<div className="meta">
				{article.author && article.author.name && (
					<div className="author">
						{t('By {{author}}', { author: article.author.name })}
					</div>
				)}
				<div className="info">
					<Time className="time" value={article.createdAt} />
					{article.url && (
						<a
							href={article.url}
							target="_blank"
							rel="noopener noreferrer"
							className="link"
						>
							<span>{t('Read More')}</span>
						</a>
					)}
				</div>
			</div>
			{article.feed.type === 'rss' &&
				article.attachments &&
				article.attachments.length > 0 && (
					<div className="attachments">
						{article.attachments.map((attachment) => {
							if (
								attachment.url &&
								attachment.mimeType &&
								(attachment.mimeType.includes('audio') ||
									attachment.mimeType.includes('video') ||
									attachment.mimeType.includes('youtube'))
							) {
								return (
									<ReactPlayer
										width="100%"
										height="100%"
										controls={true}
										key={attachment.id}
										url={attachment.url}
										config={{
											youtube: {
												playerVars: { showinfo: 0, rel: 0, playsinline: 0 },
											},
										}}
									/>
								);
							} else {
								if (
									attachment.url &&
									article.content &&
									!article.content.includes(attachment.url)
								) {
									return (
										<div key={attachment.id}>
											<img
												src={attachment.url}
												alt={attachment.title}
												onClick={() => {
													openModal({ alt: attachment.title, src: attachment.url });
												}}
												referrerPolicy="no-referrer"
											/>
										</div>
									);
								} else {
									return false;
								}
							}
						})}
					</div>
				)}
			<HtmlRender article={article} openModal={openModal} />
			<Lightbox isOpen={modalIsOpen} attribs={imageAttribs} closeModal={closeModal} />
		</div>
	);
};

export default ArticleContent;
