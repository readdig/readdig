import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import * as TablerIcons from '@tabler/icons-react';

// Common emoji list
const EMOJI_LIST = [
	'📰',
	'📚',
	'💻',
	'🎮',
	'🎬',
	'🎵',
	'📷',
	'🎨',
	'✈️',
	'🍔',
	'⚽',
	'💼',
	'🏠',
	'❤️',
	'⭐',
	'🔥',
	'💡',
	'🎯',
	'🚀',
	'💰',
	'📱',
	'🌐',
	'🔒',
	'📊',
	'📈',
	'🎁',
	'🏆',
	'👍',
	'👎',
	'👏',
	'🙏',
	'💪',
	'🤖',
	'👨‍💻',
	'🧠',
	'📝',
	'✅',
	'❌',
	'⚡',
	'🌟',
];

// Common tabler icons (icon name -> component name mapping)
const COMMON_ICONS = [
	'IconNews',
	'IconBook',
	'IconCode',
	'IconDeviceGamepad2',
	'IconMovie',
	'IconMusic',
	'IconCamera',
	'IconPalette',
	'IconPlane',
	'IconToolsKitchen2',
	'IconBallFootball',
	'IconBriefcase',
	'IconHome',
	'IconHeart',
	'IconStar',
	'IconFlame',
	'IconBulb',
	'IconTarget',
	'IconRocket',
	'IconCoin',
	'IconDeviceMobile',
	'IconWorld',
	'IconLock',
	'IconChartBar',
	'IconTrendingUp',
	'IconGift',
	'IconTrophy',
	'IconThumbUp',
	'IconThumbDown',
	'IconHandLoveYou',
	'IconPray',
	'IconMuscle',
	'IconRobot',
	'IconUserCode',
	'IconBrain',
	'IconPencil',
	'IconCheck',
	'IconX',
	'IconBolt',
	'IconSparkles',
	'IconRss',
	'IconCategory',
	'IconBookmark',
	'IconBell',
	'IconMail',
	'IconMessage',
	'IconSearch',
	'IconSettings',
	'IconUser',
	'IconUsers',
	'IconFolder',
	'IconFile',
	'IconPhoto',
	'IconVideo',
	'IconMicrophone',
	'IconHeadphones',
	'IconSpeakerphone',
	'IconCar',
	'IconBike',
	'IconBus',
	'IconCoffee',
	'IconPizza',
	'IconApple',
];

const IconPicker = ({ value, onChange }) => {
	const { t } = useTranslation();
	const [tab, setTab] = useState('emoji'); // 'emoji' | 'icon' | 'url'
	const [url, setUrl] = useState('');
	const [iconSearch, setIconSearch] = useState('');
	const inputRef = useRef(null);

	// Detect current value type
	useEffect(() => {
		if (!value) {
			setTab('emoji');
			setUrl('');
			return;
		}

		if (value.startsWith('http') || value.startsWith('/')) {
			setTab('url');
			setUrl(value);
		} else if (value.startsWith('Icon')) {
			setTab('icon');
		} else {
			setTab('emoji');
		}
	}, [value]);

	// Get filtered icon list
	const filteredIcons = useMemo(() => {
		if (!iconSearch.trim()) {
			return COMMON_ICONS;
		}
		const searchLower = iconSearch.toLowerCase();
		// Search all icons
		return Object.keys(TablerIcons)
			.filter(
				(name) =>
					name.startsWith('Icon') &&
					name.toLowerCase().includes(searchLower) &&
					!name.includes('Filled'),
			)
			.slice(0, 60);
	}, [iconSearch]);

	const handleEmojiClick = useCallback(
		(emoji) => {
			onChange(emoji);
		},
		[onChange],
	);

	const handleIconClick = useCallback(
		(iconName) => {
			onChange(iconName);
		},
		[onChange],
	);

	const handleUrlChange = useCallback(
		(e) => {
			const newUrl = e.target.value;
			setUrl(newUrl);
			if (newUrl.startsWith('http') || newUrl.startsWith('/')) {
				onChange(newUrl);
			}
		},
		[onChange],
	);

	const handleUrlBlur = useCallback(() => {
		if (url && (url.startsWith('http') || url.startsWith('/'))) {
			onChange(url);
		}
	}, [url, onChange]);

	// Render icon component
	const renderTablerIcon = useCallback((iconName, size = 24) => {
		const IconComponent = TablerIcons[iconName];
		if (!IconComponent) return null;
		return <IconComponent size={size} stroke={1.5} />;
	}, []);

	return (
		<div className="icon-picker">
			<div className="icon-picker-tabs">
				<button
					type="button"
					className={classNames('tab', { active: tab === 'emoji' })}
					onClick={() => setTab('emoji')}
				>
					{t('Emoji')}
				</button>
				<button
					type="button"
					className={classNames('tab', { active: tab === 'icon' })}
					onClick={() => setTab('icon')}
				>
					{t('Icon')}
				</button>
				<button
					type="button"
					className={classNames('tab', { active: tab === 'url' })}
					onClick={() => setTab('url')}
				>
					{t('URL')}
				</button>
			</div>

			<div className="icon-picker-content">
				{tab === 'emoji' && (
					<div className="emoji-grid">
						{EMOJI_LIST.map((emoji) => (
							<button
								key={emoji}
								type="button"
								className={classNames('emoji-item', { active: value === emoji })}
								onClick={() => handleEmojiClick(emoji)}
							>
								{emoji}
							</button>
						))}
					</div>
				)}

				{tab === 'icon' && (
					<div className="icon-section">
						<input
							ref={inputRef}
							type="text"
							className="icon-search"
							placeholder={t('Search icons...')}
							value={iconSearch}
							onChange={(e) => setIconSearch(e.target.value)}
						/>
						<div className="icon-grid">
							{filteredIcons.map((iconName) => (
								<button
									key={iconName}
									type="button"
									className={classNames('icon-item', { active: value === iconName })}
									onClick={() => handleIconClick(iconName)}
									title={iconName.replace('Icon', '')}
								>
									{renderTablerIcon(iconName, 22)}
								</button>
							))}
						</div>
					</div>
				)}

				{tab === 'url' && (
					<div className="url-section">
						<input
							type="text"
							className="url-input"
							placeholder={t('Enter image URL...')}
							value={url}
							onChange={handleUrlChange}
							onBlur={handleUrlBlur}
						/>
						{url && (url.startsWith('http') || url.startsWith('/')) && (
							<div className="url-preview">
								<img
									src={url}
									alt="preview"
									onError={(e) => (e.target.style.display = 'none')}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default IconPicker;
