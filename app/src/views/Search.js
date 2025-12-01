import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PageTitle from '../components/PageTitle';
import SearchInput from '../components/SearchInput';

import Loader from '../components/Loader';
import Image from '../components/Image';
import ArticleItem from '../components/Feeds/ArticleItem';
import { cleanHTML } from '../utils/sanitize';
import { search } from '../api/search';
import fetch from '../utils/fetch';

const Search = () => {
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const [results, setResults] = useState({ feeds: [], articles: [] });
	const [loading, setLoading] = useState(false);
	const [searched, setSearched] = useState(false);

	const location = useLocation();

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const q = params.get('q');
		if (q) {
			setQuery(q);
		}
	}, [location.search]);

	useEffect(() => {
		const doSearch = async () => {
			if (!query.trim()) {
				setResults({ feeds: [], articles: [] });
				setSearched(false);
				return;
			}

			setLoading(true);
			try {
				let res;
				if (filterType === 'all') {
					res = await search(query);
					setResults(res.data);
				} else if (filterType === 'feed') {
					res = await search(query);
					setResults({ feeds: res.data.feeds, articles: [] });
				} else {
					// stars, recent-read, recent-played
					res = await fetch('GET', '/articles', null, { q: query, type: filterType });
					setResults({ feeds: [], articles: res.data });
				}
				setSearched(true);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		const timer = setTimeout(() => {
			doSearch();
		}, 500);

		return () => clearTimeout(timer);
	}, [query, filterType]);

	const filterOptions = [
		{ value: 'all', label: t('All') },
		{ value: 'feed', label: t('Feeds') },
		{ value: 'stars', label: t('Stars') },
		{ value: 'recent-read', label: t('Recent Read') },
		{ value: 'recent-played', label: t('Recent Played') },
	];

	return (
		<div className="search-results">
			<PageTitle title={t('Search')} />
			<div className="filters">
				<div className="search">
					<SearchInput
						type="text"
						placeholder={t('Search')}
						value={query}
						onChange={(val) => setQuery(val)}
					/>
				</div>
				<div className="select">
					<Select
						className="select-container"
						classNamePrefix="select"
						placeholder={t('Type')}
						isClearable={false}
						options={filterOptions}
						value={filterOptions.find((o) => o.value === filterType)}
						onChange={(val) => setFilterType(val ? val.value : 'all')}
					/>
				</div>
			</div>

			{loading && (
				<div className="loading">
					<Loader />
				</div>
			)}

			{!loading && searched && (
				<div className="search-results-content">
					{results.feeds.length === 0 && results.articles.length === 0 && (
						<div className="no-content">{t('No results found')}</div>
					)}

					{[...results.feeds, ...results.articles].map((item) => {
						if (item.type === 'rss' || item.type === 'podcast') {
							const desc = cleanHTML(item.description);
							return (
								<Link className="article-item" key={item.id} to={`/feed/${item.id}`}>
									<div className="left">
										<div className="icon">
											<Image
												relative={true}
												src={`/images/feed/${item.id}?w=120&h=120`}
											/>
										</div>
									</div>
									<div className="right">
										<h4 title={item.title}>{item.title}</h4>
										{desc && <div className="desc">{desc}</div>}
									</div>
								</Link>
							);
						} else {
							return (
								<ArticleItem
									key={item.id}
									article={item}
									to={`/feed/${item.feed.id}/article/${item.id}`}
								/>
							);
						}
					})}
				</div>
			)}
		</div>
	);
};

export default Search;
