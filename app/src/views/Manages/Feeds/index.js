import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import ActionPopover from './ActionPopover';
import FilterPopover from './FilterPopover';
import ViewModal from './ViewModal';

import Loader from '../../../components/Loader';
import Image from '../../../components/Image';
import PageTitle from '../../../components/PageTitle';
import TimeAgo from '../../../components/TimeAgo';
import SearchInput from '../../../components/SearchInput';
import MoreIcon from '../../../components/MoreIcon';
import Paging from '../../../components/Paging';

import config from '../../../config';
import { getFeeds, exportOPML } from '../../../api/feed';

import { ReactComponent as FeedIcon } from '../../../images/icons/rss.svg';
import { ReactComponent as PodcastIcon } from '../../../images/icons/podcast.svg';

const Feeds = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [exporting, setExporting] = useState(false);
	const [feed, setFeed] = useState();
	const [feeds, setFeeds] = useState([]);
	const [modal, setModal] = useState({});
	const [popover, setPopover] = useState({});
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
		sort_by: 'createdAt,-1',
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await getFeeds(filters);
			setFeeds(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	}, [filters]);

	const handleExport = async () => {
		try {
			toast.dismiss();
			setExporting(true);
			const res = await exportOPML();
			if (res.data) {
				const link = document.createElement('a');
				const blob = new Blob([res.data], { type: 'text/xml' });
				link.href = URL.createObjectURL(blob);
				link.download = `${config.product.name.toLowerCase()}-all-feeds.xml`;
				link.click();
				toast.success(t('Feeds exported successfully'));
			}
			setExporting(false);
		} catch (err) {
			setExporting(false);
			toast.error(t('Failed to export feeds'));
		}
	};

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const openPopover = (anchorRef, skipClick, feed) => {
		setFeed(feed);
		setPopover({
			anchorRef,
			skipClick,
			id: popover.id === feed.id ? '' : feed.id,
			isOpen: !popover.isOpen,
		});
	};

	const closePopover = () => {
		setPopover({});
	};

	const openModal = (modal, feed) => {
		setFeed(feed);
		setModal(modal);
	};

	const closeModal = () => {
		setModal({});
	};

	return (
		<>
			<PageTitle title={t('Manage feeds')} />
			<h1>{t('Manage feeds')}</h1>
			<div className="filters">
				<div className="box">
					<SearchInput
						type="text"
						onChange={(value) => {
							setFilters({ ...filters, q: value });
						}}
					/>
				</div>
				<button
					className="btn opml"
					onClick={handleExport}
					disabled={exporting}
					type="button"
				>
					{exporting ? t('Exporting...') : t('Export OPML')}
				</button>
				<FilterPopover
					sortBy={filters.sort_by}
					onChange={(value) => {
						setFilters({ ...filters, sort_by: value });
					}}
				/>
			</div>
			<div className="settings-list">
				{loading && <Loader />}
				{!loading && feeds.length === 0 && (
					<div className="no-content">{t('No feeds found')}</div>
				)}
				{!loading && feeds.length > 0 && (
					<ul>
						{feeds.map((feed) => (
							<li
								key={feed.id}
								className={classNames('item', {
									active: popover.id === feed.id,
								})}
								onClick={() => openModal({ viewModalIsOpen: true }, feed)}
							>
								<div className="left">
									<div className="icon bg">
										<Image relative={true} src={`/images/feed/${feed.id}?w=60&h=60`} />
									</div>
								</div>
								<div className="right">
									<div className="info">
										<div className="title" title={feed.title}>
											{feed.title}
										</div>
										<div className="type">
											{feed.valid && (
												<>
													{feed.type === 'rss' && <FeedIcon />}
													{feed.type === 'podcast' && <PodcastIcon />}
												</>
											)}
										</div>
										<div className="action">
											<MoreIcon
												onClick={(anchorRef, skipClick) => {
													openPopover(anchorRef, skipClick, feed);
												}}
											/>
										</div>
									</div>
									<div className="meta">
										<span>
											{t('Created at') + ' '}
											<TimeAgo value={feed.createdAt} />
											{', '}
										</span>
										<span>
											{t('Updated at') + ' '}
											<TimeAgo value={feed.lastScraped} />
										</span>
									</div>
									<div className="meta">
										{feed.type &&
											(feed.type === 'rss' ? (
												<span>{t('RSS') + ', '}</span>
											) : (
												<span>{t('Podcast') + ', '}</span>
											))}
										{feed.feedType &&
											(feed.feedType === 'xmlfeed' ? (
												<span>XML Feed, </span>
											) : (
												<span>JSON Feed, </span>
											))}
										<span>
											{t('{{followerCount}} Subscribers', {
												followerCount: feed.followerCount,
											}) + ', '}
										</span>
										<span>
											{t('{{postCount}} Articles', { postCount: feed.postCount })}
										</span>
										{feed.duplicateOf && <span>{', ' + t('Duplicate feed')}</span>}
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
				{(feeds.length > 0 || (feeds.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={feeds.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
			<ActionPopover {...popover} feed={feed} onClose={closePopover} onEnd={fetchData} />
			<ViewModal feed={feed} isOpen={modal.viewModalIsOpen} closeModal={closeModal} />
		</>
	);
};

export default Feeds;
