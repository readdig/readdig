import Subscription from '../controllers/subscription';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/subscriptions/plans').get(wrapAsync(Subscription.plans));
	api.route('/subscriptions/cancel').post(wrapAsync(Subscription.cancel));
	api.route('/subscriptions/transaction').post(wrapAsync(Subscription.transaction));
	api.route('/subscriptions/:planId').post(wrapAsync(Subscription.post));
	api.route('/subscriptions/:subscriptionId').get(wrapAsync(Subscription.get));
};
