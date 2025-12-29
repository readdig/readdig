import React, { useState, useEffect, useCallback } from 'react';
import ReactModal from 'react-modal';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import Loader from '../../../components/Loader';
import Image from '../../../components/Image';
import {
	SearchIndicator,
	NoOptionsMessage,
	Option,
} from '../../../components/Feeds/FeedOption';

import {
	getCategoryFeeds,
	removeFeedFromCategory,
	addFeedToCategory,
} from '../../../api/category';
import { getFeeds } from '../../../api/feed';

import { IconX } from '@tabler/icons-react';

const FeedsModal = ({ category, isOpen, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [feeds, setFeeds] = useState([]);
	const [submitting, setSubmitting] = useState({});

	const fetchFeeds = useCallback(async () => {
		if (!category) return;
		try {
			setLoading(true);
			const res = await getCategoryFeeds(category.id);
			setFeeds(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
			toast.error(t('Failed to load feeds'));
		}
	}, [category, t]);

	useEffect(() => {
		if (isOpen && category) {
			fetchFeeds();
		}
	}, [isOpen, category, fetchFeeds]);

	const onClose = () => {
		toast.dismiss();
		closeModal();
	};

	const handleRemove = async (feedId) => {
		try {
			setSubmitting({ ...submitting, [feedId]: true });
			await removeFeedFromCategory(category.id, feedId);
			setFeeds(feeds.filter((f) => f.id !== feedId));
			setSubmitting({ ...submitting, [feedId]: false });
			toast.success(t('Feed removed from category'));
			onEnd && onEnd();
		} catch (err) {
			setSubmitting({ ...submitting, [feedId]: false });
			toast.error(t('Failed to remove feed'));
		}
	};

	const handleAdd = async (selected) => {
		if (!selected) return;
		const feed = selected.feed;
		try {
			setSubmitting({ ...submitting, [feed.id]: true });
			await addFeedToCategory(category.id, feed.id);
			setFeeds([...feeds, feed]);
			setSubmitting({ ...submitting, [feed.id]: false });
			toast.success(t('Feed added to category'));
			onEnd && onEnd();
		} catch (err) {
			setSubmitting({ ...submitting, [feed.id]: false });
			toast.error(err.response?.data || t('Failed to add feed'));
		}
	};

	const feedIds = feeds.map((f) => f.id);

	const loadOptions = async (inputValue) => {
		if (!inputValue || inputValue.length < 2) return [];
		const res = await getFeeds({ q: inputValue, per_page: 10 });
		const data = res.data
			.filter((f) => !feedIds.includes(f.id))
			.map((f) => ({ value: f.id, label: f.title, feed: f }));
		return data;
	};

	if (!isOpen) return null;

	return (
		<ReactModal
			ariaHideApp={false}
			className="modal modal-feeds"
			isOpen={true}
			onRequestClose={onClose}
			overlayClassName="modal-overlay"
			shouldCloseOnOverlayClick={false}
		>
			<header>
				<h1>{t('Manage feeds in {{name}}', { name: category?.name })}</h1>
			</header>
			<section>
				<div className="form-group">
					<label>{t('Search feeds to add')}</label>
					<AsyncSelect
						className="select-container"
						classNamePrefix="select"
						placeholder={t('Search feeds...')}
						cacheOptions={false}
						defaultOptions={false}
						value={null}
						components={{ DropdownIndicator: SearchIndicator, NoOptionsMessage, Option }}
						loadOptions={loadOptions}
						onChange={handleAdd}
						isClearable
					/>
				</div>
				<div className="form-group">
					<label>{t('Feeds in this category')}</label>
					{loading && <Loader />}
					{!loading && feeds.length > 0 && (
						<ul className="feeds-list">
							{feeds.map((feed) => (
								<li key={feed.id}>
									<div className="icon">
										<Image relative={true} src={`/images/feed/${feed.id}?w=40&h=40`} />
									</div>
									<div className="title">{feed.title}</div>
									<button
										className="btn icon-btn danger"
										onClick={() => handleRemove(feed.id)}
										disabled={submitting[feed.id]}
									>
										<IconX size={16} />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className="buttons">
					<button type="button" className="btn link cancel" onClick={onClose}>
						{t('Close')}
					</button>
				</div>
			</section>
		</ReactModal>
	);
};

export default FeedsModal;
