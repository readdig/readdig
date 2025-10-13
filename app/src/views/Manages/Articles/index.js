import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Loader from '../../../components/Loader';
import Image from '../../../components/Image';
import PageTitle from '../../../components/PageTitle';
import TimeAgo from '../../../components/TimeAgo';
import SearchInput from '../../../components/SearchInput';
import Paging from '../../../components/Paging';
import FilterPopover from './FilterPopover';

import { getPosts } from '../../../api/post';

const Articles = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [articles, setArticles] = useState([]);
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
		sort_by: 'createdAt,-1',
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await getPosts(filters);
				setArticles(res.data);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [filters]);

	return (
		<>
			<PageTitle title={t('Manage articles')} />
			<h1>{t('Manage articles')}</h1>
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
				{!loading && articles.length === 0 && (
					<div className="no-content">{t('No articles found')}</div>
				)}
				{!loading && articles.length > 0 && (
					<ul>
						{articles.map((item) => (
							<li key={item.id} className="item">
								<div className="left">
									<div className="icon bg">
										<Image relative={true} src={`/images/article/${item.id}?w=60&h=60`} />
									</div>
								</div>
								<div className="right">
									<div className="info">
										<div className="title" title={item.title}>
											{item.title}
										</div>
									</div>
									<div className="meta">
										<span>
											{t('Created at') + ' '}
											<TimeAgo value={item.createdAt} />
											{', '}
										</span>
										<span>{item.feed.title}</span>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
				{(articles.length > 0 || (articles.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={articles.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
		</>
	);
};

export default Articles;
