import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Loader from '../../components/Loader';
import PageTitle from '../../components/PageTitle';
import { getStats } from '../../api/total';

const Totals = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await getStats();
				setData(res.data);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [setLoading, setData]);

	return (
		<>
			<PageTitle title={t('Statistics')} />
			<h1>{t('Statistics')}</h1>
			{loading && <Loader />}
			{!loading && data && (
				<div className="settings-cards">
					<div className="settings-card">
						<h3 className="mt-0">Feeds totals</h3>
						<div>Totals: {data.feeds.count || 0}</div>
						<div>Valid: {data.feeds.validCount || 0}</div>
						<div>Invalid: {data.feeds.invalidCount || 0}</div>
						<div>Failure: {data.feeds.failureCount || 0}</div>
						<div>Duplicate: {data.feeds.duplicateOfCount || 0}</div>
					</div>
					<div className="settings-card">
						<h3>Articles totals</h3>
						<div>Totals: {data.articles.count || 0}</div>
						<div>Valid: {data.articles.validCount || 0}</div>
						<div>Duplicate: {data.articles.duplicateOfCount || 0}</div>
					</div>
					<div className="settings-card">
						<h3>Accounts totals</h3>
						<div>Totals: {data.users.count || 0}</div>
						<div>Online: {data.users.onlineCount || 0}</div>
						<div>Active: {data.users.activeCount || 0}</div>
						<div>Inactive: {data.users.inactiveCount || 0}</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Totals;
