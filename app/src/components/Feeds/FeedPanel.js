import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { sort } from 'fast-sort';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import Loader from '../Loader';
import Image from '../Image';
import Holdable from '../Holdable';
import FolderPopover from '../Folders/FolderPopover';
import FeedPopover from './FeedPopover';
import FeedCount from './FeedCount';
import MoreButton from '../MoreButton';
import CustomIcon from '../Folders/CustomIcon';
import { getCollections } from '../../api/collection';

const FeedPanel = () => {
	const dispatch = useDispatch();
	const feedsRef = useRef();
	const { t } = useTranslation();
	const follows = useSelector((state) =>
		sort(Object.values(state.follows || {})).asc('title'),
	);
	const folders = useSelector((state) =>
		sort(Object.values(state.folders || {})).asc('name'),
	);
	const folderIsOpen = useSelector((state) => state.folderIsOpen || {});
	const [loading, setLoading] = useState(true);
	const [feed, setFeed] = useState();
	const [folder, setFolder] = useState();
	const [feedPopover, setFeedPopover] = useState({});
	const [folderPopover, setFolderPopover] = useState({});
	const { feedId, folderId } = useParams();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				await getCollections(dispatch);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [dispatch]);

	useEffect(() => {
		const feedScrollPosition = localStorage['feedScrollPosition'];
		if (
			feedsRef.current &&
			feedScrollPosition &&
			feedsRef.current.scrollTop !== parseInt(feedScrollPosition)
		) {
			feedsRef.current.scrollTop = parseInt(feedScrollPosition);
		}
	});

	const toggleFolder = (folderId) => {
		if (folderId) {
			const isOpenFolder = { ...folderIsOpen };

			if (isOpenFolder[folderId]) {
				delete isOpenFolder[folderId];
			} else {
				isOpenFolder[folderId] = true;
			}

			localStorage.setItem('folderIsOpen', JSON.stringify(isOpenFolder));
			dispatch({ type: 'UPDATE_FOLDER_OPEN', folderIsOpen: isOpenFolder });
		}
	};

	const onScroll = () => {
		if (feedsRef.current) {
			localStorage['feedScrollPosition'] = feedsRef.current.scrollTop;
		}
	};

	const openPopover = (anchorRef, skipClick, action, feed, folder) => {
		setFeed(feed);
		setFolder(folder);
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
		setFeedPopover({});
		setFolderPopover({});
	};

	return (
		<div className="feeds" ref={feedsRef} onScroll={onScroll}>
			{loading && <Loader />}
			{!loading && follows.length === 0 && folders.length === 0 && (
				<div className="no-content">{t('No feeds found')}</div>
			)}
			{!loading && (follows.length > 0 || folders.length > 0) && (
				<ul>
					{folders.map((folder) => {
						const feeds = follows.filter((f) => f.folderId && f.folderId === folder.id);
						const folderState =
							folderIsOpen[folder.id] || (folderIsOpen[folder.id] && folderId && feedId);
						return (
							<li className="folders" key={folder.id}>
								<Link
									className={classNames({
										active: folderId === folder.id && !feedId,
									})}
									to={`/folder/${folder.id}`}
									title={folder.name}
								>
									<Holdable
										className="icon"
										isOpen={folderState}
										onClick={() => {
											toggleFolder(folder.id);
										}}
									>
										<CustomIcon isOpen={folderState} src={folder.icon} />
									</Holdable>
									<div className="title">{folder.name}</div>
									<FeedCount
										unreadCount={feeds.reduce((sum, f) => sum + (f.unreadCount || 0), 0)}
										postCount={feeds.reduce((sum, f) => sum + (f.postCount || 0), 0)}
									/>
									<div className="action">
										<MoreButton
											onClick={(anchorRef, skipClick) =>
												openPopover(anchorRef, skipClick, 'folder', undefined, folder)
											}
										/>
									</div>
								</Link>
								<ul
									className={classNames({
										open:
											folderIsOpen[folder.id] ||
											(folderIsOpen[folder.id] && folderId && feedId),
									})}
								>
									{feeds.map((feed) => (
										<li
											key={feed.id}
											className={classNames({
												active: feedId === feed.id,
											})}
										>
											<Link
												to={`/folder/${folder.id}/feed/${feed.id}`}
												title={feed.title}
											>
												<div className="icon">
													<Image
														relative={true}
														src={`/images/feed/${feed.id}?w=60&h=60`}
														alt={feed.title}
													/>
												</div>
												<div className="title">{feed.title}</div>
												<FeedCount
													unreadCount={feed.unreadCount}
													postCount={feed.postCount}
												/>
												<div className="action">
													<MoreButton
														onClick={(anchorRef, skipClick) =>
															openPopover(anchorRef, skipClick, 'feed', feed, folder)
														}
													/>
												</div>
											</Link>
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
								className={classNames({
									active: feedId === feed.id,
								})}
							>
								<Link to={`/feed/${feed.id}`} title={feed.title}>
									<div className="icon">
										<Image
											relative={true}
											src={`/images/feed/${feed.id}?w=60&h=60`}
											alt={feed.title}
										/>
									</div>
									<div className="title">{feed.title}</div>
									<FeedCount unreadCount={feed.unreadCount} postCount={feed.postCount} />
									<div className="action">
										<MoreButton
											onClick={(anchorRef, skipClick) =>
												openPopover(anchorRef, skipClick, 'feed', feed)
											}
										/>
									</div>
								</Link>
							</li>
						))}
				</ul>
			)}
			<FeedPopover {...feedPopover} feed={feed} folder={folder} onClose={closePopover} />
			<FolderPopover {...folderPopover} folder={folder} onClose={closePopover} />
		</div>
	);
};

export default FeedPanel;
