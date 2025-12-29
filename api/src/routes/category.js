import Category from '../controllers/category';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/categories').get(wrapAsync(Category.list));
	api.route('/categories').post(wrapAsync(Category.post));
	api.route('/categories/:id').get(wrapAsync(Category.get));
	api.route('/categories/:id').put(wrapAsync(Category.put));
	api.route('/categories/:id').delete(wrapAsync(Category.delete));
	api.route('/categories/:id/feeds').get(wrapAsync(Category.getFeeds));
	api.route('/categories/:id/feeds').put(wrapAsync(Category.updateFeeds));
	api.route('/categories/:id/feeds/:feedId').post(wrapAsync(Category.addFeed));
	api.route('/categories/:id/feeds/:feedId').delete(wrapAsync(Category.removeFeed));
};
