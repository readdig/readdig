import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import Loader from '../../../components/Loader';
import PageTitle from '../../../components/PageTitle';
import TimeAgo from '../../../components/TimeAgo';
import SearchInput from '../../../components/SearchInput';
import MoreButton from '../../../components/MoreButton';
import Paging from '../../../components/Paging';
import AddModal from './AddModal';
import FilterPopover from './FilterPopover';
import ActionPopover from './ActionPopover';

import { getPlans } from '../../../api/plan';
import { parseBillingType } from '../../../utils/parsers';

const Plans = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [plan, setPlan] = useState();
	const [plans, setPlans] = useState([]);
	const [popover, setPopover] = useState({});
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
		sort_by: 'basePrice,1',
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await getPlans(filters);
			setPlans(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	}, [filters]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const openPopover = (anchorRef, skipClick, plan) => {
		setPlan(plan);
		setPopover({
			anchorRef,
			skipClick,
			id: popover.id === plan.id ? '' : plan.id,
			isOpen: !popover.isOpen,
		});
	};

	const closePopover = () => {
		setPopover({});
	};

	return (
		<>
			<PageTitle title={t('Manage plans')} />
			<h1>{t('Manage plans')}</h1>
			<div className="filters">
				<div className="box">
					<SearchInput
						type="text"
						onChange={(value) => {
							setFilters({ ...filters, page: 1, name: value });
						}}
					/>
				</div>
				<AddModal onEnd={fetchData} />
				<FilterPopover
					sortBy={filters.sort_by}
					onChange={(value) => {
						setFilters({ ...filters, page: 1, sort_by: value });
					}}
				/>
			</div>
			<div className="settings-list">
				{loading && <Loader />}
				{!loading && plans.length === 0 && (
					<div className="no-content">{t('No plans found')}</div>
				)}
				{!loading && plans.length > 0 && (
					<ul>
						{plans.map((item) => (
							<li
								key={item.id}
								className={classNames('item', {
									active: popover.id === item.id,
								})}
							>
								<div className="right">
									<div className="info">
										<div className="title" title={item.name}>
											<span>{item.name}</span>
										</div>
										<div className="action">
											<MoreButton
												onClick={(anchorRef, skipClick) => {
													openPopover(anchorRef, skipClick, item);
												}}
											/>
										</div>
									</div>
									<div className="meta">
										<span>
											{t('Created at') + ' '}
											<TimeAgo value={item.createdAt} />
										</span>
									</div>
									<div className="meta">
										{item.productId && <span>{item.productId}, </span>}
										<span>
											US${item.basePrice}
											{'/'}
											{parseBillingType(item.billingPeriod, item.billingType)}
										</span>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
				{(plans.length > 0 || (plans.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={plans.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
			<ActionPopover {...popover} plan={plan} onClose={closePopover} onEnd={fetchData} />
		</>
	);
};

export default Plans;
