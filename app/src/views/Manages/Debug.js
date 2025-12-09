import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageTitle from '../../components/PageTitle';
import Loader from '../../components/Loader';
import { debugOG, debugFeed, debugDiscover } from '../../api/debug';

const Debug = () => {
	const { t } = useTranslation();
	const [debugType, setDebugType] = useState('feed');
	const [url, setUrl] = useState('');
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleDebug = async () => {
		if (!url.trim()) return;
		setLoading(true);
		setResult(null);
		let res;
		if (debugType === 'og') {
			res = await debugOG(url);
		} else if (debugType === 'feed') {
			res = await debugFeed(url);
		} else if (debugType === 'discover') {
			res = await debugDiscover(url);
		}
		if (res && res.data) {
			setResult(res.data);
		}
		setLoading(false);
	};

	const getPlaceholder = () => {
		switch (debugType) {
			case 'og':
				return 'https://example.com/article';
			case 'feed':
				return 'https://example.com/feed.xml';
			case 'discover':
				return 'https://example.com';
			default:
				return 'https://example.com';
		}
	};

	const getButtonText = () => {
		switch (debugType) {
			case 'og':
				return t('Debug OG');
			case 'feed':
				return t('Debug Feed');
			case 'discover':
				return t('Debug Discover');
			default:
				return t('Debug');
		}
	};

	return (
		<>
			<PageTitle title={t('Debug')} />
			<h1>{t('Debug')}</h1>

			<div className="debug-content">
				<form className="settings-form">
					<div className="debug-form-row">
						<select
							value={debugType}
							onChange={(e) => {
								setDebugType(e.target.value);
								setResult(null);
							}}
						>
							<option value="og">OG</option>
							<option value="feed">Feed</option>
							<option value="discover">Discover</option>
						</select>
						<input
							type="text"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={getPlaceholder()}
						/>
						<button
							type="button"
							className="btn primary"
							onClick={handleDebug}
							disabled={loading || !url.trim()}
						>
							{getButtonText()}
						</button>
					</div>
				</form>

				{loading && <Loader />}

				{result && (
					<div className="debug-result">
						<pre>{JSON.stringify(result, null, 2)}</pre>
					</div>
				)}
			</div>
		</>
	);
};

export default Debug;
