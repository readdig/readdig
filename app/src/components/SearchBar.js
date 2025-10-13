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

import { ReactComponent as StarIcon } from '../images/icons/star-outline.svg';
import { ReactComponent as NewsIcon } from '../images/icons/newspaper-variant-outline.svg';
import { ReactComponent as CircleIcon } from '../images/icons/record-circle-outline.svg';
import { ReactComponent as PlayCircleIcon } from '../images/icons/play-circle-outline.svg';
import { ReactComponent as RSSIcon } from '../images/icons/rss-box.svg';

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
		const menu = [
			{ type: 'menu', icon: NewsIcon, url: '/', title: t('Primary') },
			{ type: 'menu', icon: StarIcon, url: '/stars', title: t('Stars') },
			{ type: 'menu', icon: CircleIcon, url: '/recent-read', title: t('Recent Read') },
			{
				type: 'menu',
				icon: PlayCircleIcon,
				url: '/recent-played',
				title: t('Recent Played'),
			},
			{ type: 'menu', icon: RSSIcon, url: '/library', title: t('Library') },
		];
		return [
			...menu,
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
		if (results.length > 1) {
			if (e.keyCode === 40) {
				// 40 is down
				e.preventDefault();

				let newPos = selectedIndex + 1;
				if (newPos > 9) newPos = 0;

				setSelectedIndex(newPos);
			} else if (e.keyCode === 38) {
				// 38 is up
				e.preventDefault();

				let newPos = selectedIndex - 1;
				if (newPos < 0) newPos = 0;

				setSelectedIndex(newPos);
			}
		}
	};

	const handleFormSubmit = (e) => {
		e.preventDefault();

		if (!results.length) return;
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
							results.slice(0, 10).map((item, i) => (
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
									</div>
									<div className="title">{item.title}</div>
								</div>
							))}
					</div>
				</form>
				{displayResults && <div className="click-catcher" onClick={hideSearchResults} />}
			</div>
		</>
	);
};

export default SearchBar;
