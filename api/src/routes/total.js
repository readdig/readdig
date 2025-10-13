import Total from '../controllers/total';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/totals').get(wrapAsync(Total.get));
	api.route('/totals/stats').get(wrapAsync(Total.stats));
	api.route('/totals/monitoring').get(wrapAsync(Total.monitoring));
};
