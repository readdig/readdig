import React, { useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { sort } from 'fast-sort';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import classNames from 'classnames';

import Image from './Image';
import SearchInput from './SearchInput';
import CustomIcon from './Folders/CustomIcon';

import {
	IconStar,
	IconNews,
	IconCircleDot,
	IconPlayerPlay,
	IconRss,
	IconSearch,
} from '@tabler/icons-react';

const SearchBar = () => {
	const history = useHistory();
	const inputElement = useRef(null);
	const { t } = useTranslation();
	const [query, setQuery] = useState('');
	const [displayResults, setDisplayResults] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const follows = useSelector((state) =>
		sort(Object.values(state.follows || {})).asc('title'),
	);
	const folders = useSelector((state) =>
		sort(Object.values(state.folders || {})).asc('name'),
	);

	const results = useMemo(() => {
		if (!query) {
			// No query, show default menu
			const menu = [
				{ type: 'menu', icon: IconNews, url: '/', title: t('Primary') },
				{ type: 'menu', icon: IconStar, url: '/stars', title: t('Stars') },
				{
					type: 'menu',
					icon: IconCircleDot,
					url: '/recent-read',
					title: t('Recent Read'),
				},
				{
					type: 'menu',
					icon: IconPlayerPlay,
					url: '/recent-played',
					title: t('Recent Played'),
				},
				{ type: 'menu', icon: IconRss, url: '/library', title: t('Library') },
			];
			return menu;
		}

		// Search local follows and folders
		const localResults = [
			...folders.map((folder) => ({
				type: 'folder',
				icon: folder.icon,
				url: `/folder/${folder.id}`,
				title: folder.name,
			})),
			...follows.map((follow) => ({
				type: 'feed',
				icon: `/images/feed/${follow.id}?w=60&h=60`,
				url: `/feed/${follow.id}`,
				title: follow.title,
			})),
		].filter((f) => new RegExp(query, 'i').test(f.title));

		return localResults;
	}, [t, query, folders, follows]);

	useHotkeys('/', () => {
		if (!displayResults) {
			setTimeout(() => {
				inputElement.current.focus();
			});
		}
	});

	const handleInputChange = (value) => {
		setQuery(value);
		setSelectedIndex(0);
	};

	const handleInputFocus = () => {
		setDisplayResults(true);
	};

	const clearSearchResults = () => {
		inputElement.current.blur();
		setDisplayResults(false);
		setQuery('');
	};

	const hideSearchResults = () => {
		inputElement.current.blur();
		setDisplayResults(false);
	};

	const handleResultClick = (url) => {
		clearSearchResults();
		history.push(url);
	};

	const handleResultMouseEnter = (index) => {
		setSelectedIndex(index);
	};

	const handleKeyDown = (e) => {
		if (e.keyCode === 27) {
			// 27 is esc
			e.preventDefault();
			clearSearchResults();
		}
		// Calculate total items: local results (max 9 when query exists) + search option (if query exists)
		const totalItems = query ? Math.min(results.length, 9) + 1 : results.length;
		if (totalItems > 1) {
			if (e.keyCode === 40) {
				// 40 is down
				e.preventDefault();

				let newPos = selectedIndex + 1;
				if (newPos >= Math.min(totalItems, 10)) newPos = 0;

				setSelectedIndex(newPos);
			} else if (e.keyCode === 38) {
				// 38 is up
				e.preventDefault();

				let newPos = selectedIndex - 1;
				if (newPos < 0) newPos = Math.min(totalItems, 10) - 1;

				setSelectedIndex(newPos);
			}
		}
	};

	const handleFormSubmit = (e) => {
		e.preventDefault();

		const searchOptionIndex = query ? Math.min(results.length, 9) : -1;

		// If search option is selected or no local results
		if (query && (selectedIndex === searchOptionIndex || results.length === 0)) {
			clearSearchResults();
			history.push(`/articles?q=${encodeURIComponent(query)}`);
			return;
		}

		if (!results.length && !query) {
			return;
		}

		const result = results[selectedIndex];
		if (!result) return;
		clearSearchResults();
		history.push(result.url);
	};

	return (
		<>
			<div className={classNames('search', { open: displayResults })}>
				<form onSubmit={handleFormSubmit}>
					<div className="search-container">
						<SearchInput
							type="text"
							autoComplete="off"
							placeholder={!displayResults ? t('Type / to search...') : ''}
							value={query}
							inputRef={inputElement}
							onFocus={handleInputFocus}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							onBlur={clearSearchResults}
						/>
						<button
							type="button"
							className="btn link cancel"
							onClick={clearSearchResults}
						>
							{t('Cancel')}
						</button>
					</div>
					<div className="panel">
						{results.length === 0 && (
							<div className="panel-element no-content">
								{t('No search results found')}
							</div>
						)}
						{results.length > 0 &&
							results.slice(0, query ? 9 : 10).map((item, i) => (
								<div
									key={item.url}
									className={classNames('panel-element', {
										selected: selectedIndex === i,
									})}
									onMouseEnter={() => handleResultMouseEnter(i)}
									onMouseDown={(e) => {
										e.preventDefault();
										handleResultClick(item.url);
									}}
								>
									<div className="icon">
										{item.type === 'menu' && <item.icon src={item.icon} />}
										{item.type === 'folder' && <CustomIcon src={item.icon} />}
										{item.type === 'feed' && (
											<Image relative={true} src={item.icon} alt={item.title} />
										)}
										{item.type === 'article' && (
											<Image relative={true} src={item.icon} alt={item.title} />
										)}
									</div>
									<div className="title">{item.title}</div>
								</div>
							))}
						{query && (
							<div
								className={classNames('panel-element', {
									selected: selectedIndex === Math.min(results.length - 1, 9),
								})}
								onMouseEnter={() =>
									handleResultMouseEnter(Math.min(results.length - 1, 9))
								}
								onMouseDown={(e) => {
									e.preventDefault();
									handleResultClick(`/articles?q=${encodeURIComponent(query)}`);
								}}
							>
								<div className="icon">
									<IconSearch />
								</div>
								<div className="title">{`${t('Search')} "${query}"`}</div>
							</div>
						)}
					</div>
				</form>
				{displayResults && <div className="click-catcher" onClick={hideSearchResults} />}
			</div>
		</>
	);
};

export default SearchBar;
