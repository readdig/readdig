import Follow from '../controllers/follow';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/follows').get(wrapAsync(Follow.list));
	api.route('/follows').post(wrapAsync(Follow.post));
	api.route('/follows').put(wrapAsync(Follow.put));
	api.route('/follows').delete(wrapAsync(Follow.delete));
	api.route('/follows/folder').put(wrapAsync(Follow.folder));
};
