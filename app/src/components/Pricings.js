import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import Loader from './Loader';
import Time from './Time';
import ConfirmModal from './ConfirmModal';
import { parseBillingType } from '../utils/parsers';
import { getPlans } from '../api/plan';
import { updateSubscription, cancelSubscription } from '../api/subscription';

const Pricing = ({ plan = {}, submitting, onClick, onCancel }) => {
	const user = useSelector((state) => state.user || {});
	const isLoggedin = user && user.id;
	const isAdmin = user && user.admin;
	const isFree = parseFloat(plan.basePrice) === 0;
	const isFreeDisabled = isFree && user.subscription;
	const isSubscriptionActived = user.subscription && !user.subscription.expired;
	const subscription =
		user.subscription && user.subscription.planId === plan.id ? user.subscription : null;

	return (
		<div className="plan">
			<div className="info">
				<h2>{plan.name}</h2>
				<div>
					<span className="price">US${plan.basePrice}</span>
					<span className="type">
						/{parseBillingType(plan.billingPeriod, plan.billingType)}
					</span>
				</div>
				<div className="slogan">{plan.slogan}</div>
			</div>
			<div className="button">
				{!isLoggedin && (
					<Link to="/signup" className="btn primary">
						Get started
					</Link>
				)}
				{isLoggedin && (!subscription || (subscription && subscription.expired)) && (
					<button
						className="btn primary"
						disabled={submitting || isAdmin || isFreeDisabled || isSubscriptionActived}
						onClick={() => (isFree ? onClick('free', plan.id) : onClick('paid', plan.id))}
					>
						Upgrade
					</button>
				)}
				{isLoggedin && subscription && (
					<>
						{!subscription.expired && subscription.status === 'cancelled' && (
							<div className="btn pe-none">Cancelled</div>
						)}
						{!isFree && !subscription.expired && (
							<>
								{subscription.status === 'active' && (
									<button
										className="btn delete"
										disabled={submitting}
										onClick={() => onCancel(subscription.id)}
									>
										Cancel
									</button>
								)}
							</>
						)}
						{isFree && !subscription.expired && (
							<div className="btn pe-none">Current</div>
						)}
					</>
				)}
			</div>
			{isLoggedin && (
				<div className="date">
					{subscription && (
						<>
							{subscription.expired && 'Subscription has expired'}
							{!subscription.expired && (
								<>
									{isFree || subscription.status === 'cancelled'
										? 'Expires on '
										: 'Renews on '}
									<Time format="ll" value={subscription.nextBillDate} /> (in UTC)
								</>
							)}
						</>
					)}
				</div>
			)}
			{plan.features && (
				<div className="desc" dangerouslySetInnerHTML={{ __html: plan.features }} />
			)}
		</div>
	);
};

const Pricings = () => {
	const history = useHistory();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [planId, setPlanId] = useState();
	const [plans, setPlans] = useState([]);
	const [subscriptionId, setSubscriptionId] = useState();
	const [cancelConfirmIsOpen, setCancelConfirmIsOpen] = useState(false);
	const [freeConfirmIsOpen, setFreeConfirmIsOpen] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await getPlans();
				setPlans(res.data);
				setLoading(false);
			} catch (err) {
				setLoading(false);
			}
		};

		fetchData();
	}, [setLoading, setPlans]);

	const onClick = async (type, planId) => {
		try {
			toast.dismiss();
			if (type === 'free') {
				setPlanId(planId);
				setFreeConfirmIsOpen(true);
			}
			if (type === 'paid') {
				setSubmitting(true);
				const res = await updateSubscription(planId);
				history.push(`/settings/pay/${res.data.id}`);
			}
		} catch (e) {
			setSubmitting(false);
		}
	};

	const onFree = async () => {
		await updateSubscription(planId);
		toast.success('Subscribe successful');
		window.location.reload();
	};

	const onCancel = (subscriptionId) => {
		setCancelConfirmIsOpen(true);
		setSubscriptionId(subscriptionId);
	};

	const onSubmit = async () => {
		try {
			toast.dismiss();
			setSubmitting(true);
			await cancelSubscription(subscriptionId);
			toast.success('Unsubscribe successful');
			window.location.reload();
		} catch (e) {
			setSubmitting(false);
		}
	};

	const onClose = () => {
		setFreeConfirmIsOpen(false);
		setCancelConfirmIsOpen(false);
		setSubscriptionId();
		setPlanId();
	};

	return (
		<section className="plans">
			<h1>Choose the plan that's right for you.</h1>
			<p>How often do you want to pay?</p>
			<div className="pricing">
				{loading && <Loader />}
				{!loading &&
					plans.length > 0 &&
					plans.map((plan) => (
						<Pricing
							key={plan.id}
							plan={plan}
							submitting={submitting}
							onClick={onClick}
							onCancel={onCancel}
						/>
					))}
			</div>
			<ConfirmModal
				isOpen={freeConfirmIsOpen}
				message={'Are you sure to the free plan?'}
				onClose={onClose}
				onSubmit={onFree}
			/>
			<ConfirmModal
				isOpen={cancelConfirmIsOpen}
				message={'Are you sure to cancel?'}
				onClose={onClose}
				onSubmit={onSubmit}
			/>
		</section>
	);
};

export default Pricings;
