import Featured from '../controllers/featured';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/featured').get(wrapAsync(Featured.list));
	api.route('/featured/articles').get(wrapAsync(Featured.articles));
};
