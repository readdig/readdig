import React from 'react';
import ReactModal from 'react-modal';
import { useTranslation } from 'react-i18next';

import Time from '../../../components/Time';

import { ReactComponent as ExitIcon } from '../../../images/icons/close.svg';

const ViewModal = ({ isOpen = false, feed = {}, closeModal }) => {
	const { t } = useTranslation();

	return (
		isOpen && (
			<ReactModal
				className="modal modal-form"
				isOpen={true}
				ariaHideApp={false}
				onRequestClose={closeModal}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('Feed details')}</h1>
					<span className="exit" onClick={closeModal}>
						<ExitIcon />
					</span>
				</header>
				{feed.duplicateOf && (
					<div className="text-box">
						<label>{t('Duplicate ID')}:</label> {feed.duplicateOf}
					</div>
				)}
				{feed.language && (
					<div className="text-box">
						<label>{t('Language')}:</label> {feed.language}
					</div>
				)}
				<div className="text-box">
					<label>{t('ID')}:</label> {feed.id}
				</div>
				<div className="text-box">
					<label>{t('Title')}:</label> {feed.title}
				</div>
				<div className="text-box">
					<label>{t('Description')}:</label>
					{feed.description}
				</div>
				{Object.entries(feed.images).map(
					([key, value]) =>
						value && (
							<div className="text-box text-ellipsis" key={key}>
								<label style={{ textTransform: 'capitalize' }}>{key}: </label>
								<a href={value} target="_blank" rel="noopener noreferrer">
									{value}
								</a>
							</div>
						),
				)}
				<div className="text-box">
					<label>{t('URL')}:</label>
					<a href={feed.url} target="_blank" rel="noopener noreferrer">
						{feed.url}
					</a>
				</div>
				<div className="text-box">
					<label>{t('Feed URL')}:</label>
					<a href={feed.feedUrl} target="_blank" rel="noopener noreferrer">
						{feed.feedUrl}
					</a>
				</div>
				{feed.feedUrls && feed.feedUrls.length > 0 && (
					<div className="text-box">
						<label>{t('Feed URLs')}:</label>
						{feed.feedUrls.map(
							(value, index) =>
								value && (
									<div>
										<a href={value} key={index} target="_blank" rel="noopener noreferrer">
											{value}
										</a>
									</div>
								),
						)}
					</div>
				)}
				{feed.canonicalUrl && (
					<div className="text-box">
						<label>{t('Canonical URL')}:</label>
						<a href={feed.canonicalUrl} target="_blank" rel="noopener noreferrer">
							{feed.canonicalUrl}
						</a>
					</div>
				)}
				<div className="text-box">
					<label>{t('Fingerprint')}:</label>
					{feed.fingerprint}
				</div>
				<div className="text-row">
					<div className="text-col">
						<label>{t('Feed type')}: </label>
						{feed.feedType ? feed.feedType : 'null'}
					</div>
					<div className="text-col">
						<label>{t('Type')}: </label>
						{feed.type ? feed.type : 'null'}
					</div>
				</div>
				<div className="text-row">
					<div className="text-col">
						<label>{t('Featured')}: </label>
						{feed.featured.toString()}
					</div>
					<div className="text-col">
						<label>{t('Full text')}: </label>
						{feed.fullText.toString()}
					</div>
				</div>
				<div className="text-row">
					<div className="text-col">
						<label>{t('Valid')}: </label>
						{feed.valid.toString()}
					</div>
					<div className="text-col">
						<label>{t('Likes')}: </label>
						{feed.likes}
					</div>
				</div>
				<div className="text-row">
					<div className="text-col">
						<label>{t('Follower count')}: </label>
						{feed.followerCount}
					</div>
					<div className="text-col">
						<label>{t('Post count')}: </label>
						{feed.postCount}
					</div>
				</div>
				<div className="text-row">
					<div className="text-col">
						<label>{t('Scrape failures')}: </label>
						{feed.consecutiveScrapeFailures}
					</div>
					<div className="text-col">
						<label>{t('Scrape interval')}: </label>
						{feed.scrapeInterval}
					</div>
				</div>
				<div className="text-box">
					<label>{t('Last scraped')}: </label>
					<Time value={feed.lastScraped} format="YYYY/MM/DD HH:mm:ss" />
				</div>
				<div className="text-row">
					<div className="text-box">
						<label>{t('Date modified')}: </label>
						<Time value={feed.dateModified} format="YYYY/MM/DD HH:mm:ss" />
					</div>
					<div className="text-box">
						<label>{t('Date published')}: </label>
						<Time value={feed.datePublished} format="YYYY/MM/DD HH:mm:ss" />
					</div>
				</div>
				<div className="text-row">
					<div className="text-box">
						<label>{t('Created at')}: </label>
						<Time value={feed.createdAt} format="YYYY/MM/DD HH:mm:ss" />
					</div>
					<div className="text-box">
						<label>{t('Updated at')}: </label>
						<Time value={feed.updatedAt} format="YYYY/MM/DD HH:mm:ss" />
					</div>
				</div>
			</ReactModal>
		)
	);
};

export default ViewModal;
