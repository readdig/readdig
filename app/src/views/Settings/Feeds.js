import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sort } from 'fast-sort';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import Loader from '../../components/Loader';
import Image from '../../components/Image';
import Holdable from '../../components/Holdable';
import PageTitle from '../../components/PageTitle';
import MoreIcon from '../../components/MoreIcon';
import SearchInput from '../../components/SearchInput';
import CustomIcon from '../../components/Folders/CustomIcon';
import FolderSelect from '../../components/Folders/FolderSelect';
import FolderPopover from '../../components/Folders/FolderPopover';
import CollectionPopover from '../../components/CollectionPopover';
import FeedPopover from '../../components/Feeds/FeedPopover';
import FeedTypeSelect from '../../components/Feeds/FeedTypeSelect';
import FeedStatusSelect from '../../components/Feeds/FeedStatusSelect';

import { getCollections } from '../../api/collection';

import { ReactComponent as FeedIcon } from '../../images/icons/rss.svg';
import { ReactComponent as PodcastIcon } from '../../images/icons/podcast.svg';

const Feeds = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const folders = useSelector((state) =>
		sort(Object.values(state.folders || {})).asc('name'),
	);
	const follows = useSelector((state) =>
		sort(Object.values(state.follows || {})).asc('title'),
	);
	const [open, setOpen] = useState({});
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({});
	const [feed, setFeed] = useState();
	const [folder, setFolder] = useState();
	const [popoverIsOpen, setPopoverIsOpen] = useState();
	const [feedPopover, setFeedPopover] = useState({});
	const [folderPopover, setFolderPopover] = useState({});
	const [collectionPopover, setCollectionPopover] = useState({});

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const params = {
					name: filters.name,
					folderId: filters.folder ? filters.folder.value : undefined,
					status: filters.status,
					type: filters.type,
				};
				await getCollections(dispatch, params);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [dispatch, filters]);

	const allCheckbox = (e) => {
		const checkedAll = e.target.checked;
		dispatch({
			type: 'UPDATE_COLLECTIONS_CHECKED',
			checkedAll,
		});
	};

	const changeFeed = (feedId, folderId) => {
		dispatch({
			type: 'UPDATE_FEED_CHECKED',
			feedId,
			folderId,
		});
	};

	const changeFolder = (folderId) => {
		dispatch({
			type: 'UPDATE_FOLDER_CHECKED',
			folderId,
		});
	};

	const toggleFolder = (id) => {
		if (id) {
			setOpen({ ...open, [id]: !open[id] });
		}
	};

	const openCollectionPopover = (anchorRef, skipClick) => {
		setCollectionPopover({
			anchorRef,
			skipClick,
			isOpen: !collectionPopover.isOpen,
		});
	};

	const openPopover = (anchorRef, skipClick, action, id, feed, folder) => {
		setFeed(feed);
		setFolder(folder);
		setPopoverIsOpen(popoverIsOpen === id ? '' : id);
		if (action === 'feed') {
			setFeedPopover({
				anchorRef,
				skipClick,
				isOpen: !feedPopover.isOpen,
			});
		}
		if (action === 'folder') {
			setFolderPopover({
				anchorRef,
				skipClick,
				isOpen: !folderPopover.isOpen,
			});
		}
	};

	const closePopover = () => {
		setPopoverIsOpen();
		setFeedPopover({});
		setFolderPopover({});
		setCollectionPopover({});
	};

	return (
		<>
			<PageTitle title={t('My Feeds')} />
			<h1>{t('My Feeds')}</h1>
			<div className="filters col">
				<div className="search">
					<SearchInput
						type="text"
						placeholder={t('Feed or folder name')}
						onChange={(value) => {
							setFilters({ ...filters, name: value });
						}}
					/>
				</div>
				<div className="filter-field">
					<div className="select">
						<FolderSelect
							placeholder={t('Folders')}
							onChange={(item) => {
								setFilters({ ...filters, folder: item });
							}}
						/>
					</div>
					<div className="select">
						<FeedTypeSelect
							placeholder={t('Type')}
							onChange={(value) => {
								setFilters({ ...filters, type: value });
							}}
						/>
					</div>
					<div className="select">
						<FeedStatusSelect
							placeholder={t('Status')}
							onChange={(value) => {
								setFilters({ ...filters, status: value });
							}}
						/>
					</div>
				</div>
			</div>
			<div className="settings-list">
				{loading && <Loader />}
				{!loading && folders.length === 0 && follows.length === 0 && (
					<div className="no-content">{t('No feeds found')}</div>
				)}
				{!loading && (folders.length > 0 || follows.length > 0) && (
					<ul>
						<li className="settings-head">
							<div className="checkbox">
								<input
									type="checkbox"
									title={t('Select all/Cancel')}
									onChange={allCheckbox}
								/>
							</div>
							<div className="action">
								<MoreIcon
									onClick={(anchorRef, skipClick) =>
										openCollectionPopover(anchorRef, skipClick)
									}
								/>
							</div>
						</li>
						{folders.map((folder) => {
							const feeds = follows.filter((f) => f.folderId && f.folderId === folder.id);
							const checkedFeeds = feeds.filter((f) => f.checked);
							return (
								<li className="folders" key={folder.id}>
									<div
										className={classNames('item', {
											active: popoverIsOpen === folder.id,
										})}
										onClick={() => changeFolder(folder.id)}
									>
										<div className="checkbox">
											<input
												type="checkbox"
												checked={folder.checked || false}
												ref={(el) =>
													el &&
													(el.indeterminate = folder.checked
														? feeds.length !== checkedFeeds.length
														: false)
												}
												onChange={() => {}}
											/>
										</div>
										<Holdable
											className="icon"
											isOpen={open[folder.id]}
											onClick={() => {
												toggleFolder(folder.id);
											}}
										>
											<CustomIcon open={open[folder.id]} src={folder.icon} />
										</Holdable>
										<div className="title" title={folder.name}>
											{folder.name}
										</div>
										<div className="action">
											<MoreIcon
												onClick={(anchorRef, skipClick) =>
													openPopover(
														anchorRef,
														skipClick,
														'folder',
														folder.id,
														undefined,
														folder,
													)
												}
											/>
										</div>
									</div>
									<ul
										className={classNames({
											open: open[folder.id],
										})}
									>
										{feeds.map((feed) => (
											<li
												key={feed.id}
												className={classNames('item', {
													secondary: !feed.primary,
													active: popoverIsOpen === feed.id,
												})}
												onClick={() => changeFeed(feed.id, folder.id)}
											>
												<div className="checkbox">
													<input
														type="checkbox"
														checked={feed.checked || false}
														onChange={() => {}}
													/>
												</div>
												<div className="icon">
													<Image
														relative={true}
														src={`/images/feed/${feed.id}?w=60&h=60`}
														alt={feed.title}
													/>
												</div>
												<div className="title" title={feed.title}>
													{feed.title}
												</div>
												{feed.valid && (
													<>
														{feed.type === 'rss' && (
															<div className="type" title={t('RSS')}>
																<FeedIcon />
															</div>
														)}
														{feed.type === 'podcast' && (
															<div className="type" title={t('Podcast')}>
																<PodcastIcon />
															</div>
														)}
													</>
												)}
												<div className="action">
													<MoreIcon
														onClick={(anchorRef, skipClick) =>
															openPopover(
																anchorRef,
																skipClick,
																'feed',
																feed.id,
																feed,
																folder,
															)
														}
													/>
												</div>
											</li>
										))}
									</ul>
								</li>
							);
						})}
						{follows
							.filter((f) => !f.folderId)
							.map((feed) => (
								<li
									key={feed.id}
									className={classNames('item', {
										secondary: !feed.primary,
										active: popoverIsOpen === feed.id,
									})}
									onClick={() => changeFeed(feed.id)}
								>
									<div className="checkbox">
										<input
											type="checkbox"
											checked={feed.checked || false}
											onChange={() => {}}
										/>
									</div>
									<div className="icon">
										<Image
											relative={true}
											src={`/images/feed/${feed.id}?w=60&h=60`}
											alt={feed.title}
										/>
									</div>
									<div className="title" title={feed.title}>
										{feed.title}
									</div>
									{feed.valid && (
										<>
											{feed.type === 'rss' && (
												<div className="type" title={t('RSS')}>
													<FeedIcon />
												</div>
											)}
											{feed.type === 'podcast' && (
												<div className="type" title={t('Podcast')}>
													<PodcastIcon />
												</div>
											)}
										</>
									)}
									<div className="action">
										<MoreIcon
											onClick={(anchorRef, skipClick) =>
												openPopover(anchorRef, skipClick, 'feed', feed.id, feed)
											}
										/>
									</div>
								</li>
							))}
					</ul>
				)}
				<FeedPopover
					{...feedPopover}
					feed={feed}
					folder={folder}
					onClose={closePopover}
				/>
				<FolderPopover {...folderPopover} folder={folder} onClose={closePopover} />
				<CollectionPopover {...collectionPopover} onClose={closePopover} />
			</div>
		</>
	);
};

export default Feeds;
