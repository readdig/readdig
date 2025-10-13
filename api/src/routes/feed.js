import Feed from '../controllers/feed';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/feeds').get(wrapAsync(Feed.list));
	api.route('/feeds').post(wrapAsync(Feed.post));
	api.route('/feeds/merge').put(wrapAsync(Feed.merge));
	api.route('/feeds/:feedId').get(wrapAsync(Feed.get));
	api.route('/feeds/:feedId').put(wrapAsync(Feed.put));
	api.route('/feeds/:feedId').delete(wrapAsync(Feed.delete));
};
