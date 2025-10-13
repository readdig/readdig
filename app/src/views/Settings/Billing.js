import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Loader from '../../components/Loader';
import PageTitle from '../../components/PageTitle';
import Paging from '../../components/Paging';
import Time from '../../components/Time';
import { getUserPayments } from '../../api/payment';

const Billing = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState([]);
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
		sort_by: 'updatedAt,-1',
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await getUserPayments(filters);
			setData(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return (
		<>
			<PageTitle title={t('Billing history')} />
			<h1>{t('Billing history')}</h1>
			<div className="settings-table">
				{loading && <Loader />}
				{!loading && data.length === 0 && (
					<div className="no-content">{t('No billing history found')}</div>
				)}
				{!loading && data.length > 0 && (
					<table>
						<thead>
							<tr>
								<th>{t('Order ID')}</th>
								<th>{t('Plan')}</th>
								<th>{t('Payment amount')}</th>
								<th>{t('Payment status')}</th>
								<th>{t('Transaction date')}</th>
								<th>{t('Receipt')}</th>
							</tr>
						</thead>
						<tbody>
							{data.map((item) => (
								<tr key={item.id}>
									<td data-label={t('Order ID')}>{item.orderId}</td>
									<td data-label={t('Plan')}>{item.subscription.plan.name}</td>
									<td data-label={t('Payment amount')}>US${item.amount}</td>
									<td data-label={t('Payment status')}>
										<span className={item.status}>{t(item.status)}</span>
									</td>
									<td data-label={t('Transaction date')}>
										<Time
											value={
												item.status === 'refunded' ? item.refundDate : item.payoutDate
											}
										/>
									</td>
									<td data-label={t('Receipt')}>
										{item.receiptUrl && (
											<a target="_blank" rel="noreferrer" href={item.receiptUrl}>
												{t('View')}
											</a>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{(data.length > 0 || (data.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={data.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
		</>
	);
};

export default Billing;
