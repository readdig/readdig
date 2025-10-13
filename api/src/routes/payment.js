import Payment from '../controllers/payment';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/payments').get(wrapAsync(Payment.list));
	api.route('/payments/history').get(wrapAsync(Payment.history));
};
