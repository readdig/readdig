import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Loader from '../../components/Loader';
import PageTitle from '../../components/PageTitle';
import { getMonitoring } from '../../api/total';

const Monitoring = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await getMonitoring();
				setData(res.data);
			} catch (err) {
				//
			}
		};

		const interval = setInterval(() => {
			fetchData();
		}, 3000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await getMonitoring();
				setData(res.data);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	return (
		<>
			<PageTitle title={t('Monitoring')} />
			<h1>{t('Monitoring')}</h1>
			{loading && <Loader />}
			{!loading && data && (
				<div className="settings-cards">
					{data.queue && data.queue.feed && (
						<div className="settings-card">
							<h3>Feed Queue</h3>
							<div>Active: {data.queue.feed.active || 0}</div>
							<div>Waiting: {data.queue.feed.waiting || 0}</div>
							<div>Completed: {data.queue.feed.completed || 0}</div>
							<div>Paused: {data.queue.feed.paused || 0}</div>
							<div>Delayed: {data.queue.feed.delayed || 0}</div>
							<div>Failed: {data.queue.feed.failed || 0}</div>
						</div>
					)}
					{data.queue && data.queue.og && (
						<div className="settings-card">
							<h3>OG Queue</h3>
							<div>Active: {data.queue.og.active || 0}</div>
							<div>Waiting: {data.queue.og.waiting || 0}</div>
							<div>Completed: {data.queue.og.completed || 0}</div>
							<div>Paused: {data.queue.og.paused || 0}</div>
							<div>Delayed: {data.queue.og.delayed || 0}</div>
							<div>Failed: {data.queue.og.failed || 0}</div>
						</div>
					)}
					{data.queue && data.queue.fulltext && (
						<div className="settings-card">
							<h3>Fulltext Queue</h3>
							<div>Active: {data.queue.fulltext.active || 0}</div>
							<div>Waiting: {data.queue.fulltext.waiting || 0}</div>
							<div>Completed: {data.queue.fulltext.completed || 0}</div>
							<div>Paused: {data.queue.fulltext.paused || 0}</div>
							<div>Delayed: {data.queue.fulltext.delayed || 0}</div>
							<div>Failed: {data.queue.fulltext.failed || 0}</div>
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default Monitoring;
