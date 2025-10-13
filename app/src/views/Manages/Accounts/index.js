import React, { useEffect, useState, useCallback } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import Loader from '../../../components/Loader';
import Image from '../../../components/Image';
import PageTitle from '../../../components/PageTitle';
import TimeAgo from '../../../components/TimeAgo';
import SearchInput from '../../../components/SearchInput';
import MoreIcon from '../../../components/MoreIcon';
import Paging from '../../../components/Paging';
import ActionPopover from './ActionPopover';
import FilterPopover from './FilterPopover';
import UserSubscription from './UserSubscription';

import { getUsers } from '../../../api/user';

const Accounts = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState();
	const [users, setUsers] = useState([]);
	const [popover, setPopover] = useState({});
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
		sort_by: 'createdAt,-1',
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await getUsers(filters);
			setUsers(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const openPopover = (anchorRef, skipClick, user) => {
		setUser(user);
		setPopover({
			anchorRef,
			skipClick,
			id: popover.id === user.id ? '' : user.id,
			isOpen: !popover.isOpen,
		});
	};

	const closePopover = () => {
		setPopover({});
	};

	return (
		<>
			<PageTitle title={t('Manage accounts')} />
			<h1>{t('Manage accounts')}</h1>
			<div className="filters">
				<div className="box">
					<SearchInput
						type="text"
						onChange={(value) => {
							setFilters({ ...filters, page: 1, q: value });
						}}
					/>
				</div>
				<FilterPopover
					sortBy={filters.sort_by}
					onChange={(value) => {
						setFilters({ ...filters, page: 1, sort_by: value });
					}}
				/>
			</div>
			<div className="settings-list">
				{loading && <Loader />}
				{!loading && users.length === 0 && (
					<div className="no-content">{t('No accounts found')}</div>
				)}
				{!loading && users.length > 0 && (
					<ul>
						{users.map((user) => (
							<li
								key={user.id}
								className={classNames('item', {
									active: popover.id === user.id,
								})}
							>
								<div className="left">
									<div className="icon bg">
										<Image src={user.avatar} />
									</div>
								</div>
								<div className="right">
									<div className="info">
										<div className="title" title={`${user.name}(@${user.username})`}>
											<span>{user.name}</span>
											<span className="username">(@{user.username})</span>
											{user.suspended && (
												<span className="suspended">{t('Suspended')}</span>
											)}
											{user.admin && <span className="admin">{t('Admin')}</span>}
										</div>
										<div className="action">
											<MoreIcon
												onClick={(anchorRef, skipClick) => {
													openPopover(anchorRef, skipClick, user);
												}}
											/>
										</div>
									</div>
									<div className="meta">
										<span>
											{t('Created at') + ' '}
											<TimeAgo value={user.createdAt} />
											{', '}
										</span>
										<span>
											{t('Active at') + ' '}
											<TimeAgo value={user.activeAt} />
										</span>
										{(user.settings || {}).language && (
											<span>
												{', '}
												{user.settings.language}
											</span>
										)}
									</div>
									<div className="meta">
										<span>
											{t('{{followCount}} Feeds', { followCount: user.followCount })}
											{', '}
										</span>
										<span>
											{t('{{starCount}} Stars', { starCount: user.starCount })}
											{', '}
										</span>
										<span>
											{t('{{readCount}} Read', { readCount: user.readCount })}
											{', '}
										</span>
										<span>
											{t('{{playCount}} Played', { playCount: user.playCount })}
											{', '}
										</span>
										<span>
											{t('{{folderCount}} Folders', { folderCount: user.folderCount })}
										</span>
									</div>
									<UserSubscription user={user} />
								</div>
							</li>
						))}
					</ul>
				)}
				{(users.length > 0 || (users.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={users.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
			<ActionPopover {...popover} user={user} onClose={closePopover} onEnd={fetchData} />
		</>
	);
};

export default Accounts;
