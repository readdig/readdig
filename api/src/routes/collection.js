import Collection from '../controllers/collection';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/collections').get(wrapAsync(Collection.list));
};
