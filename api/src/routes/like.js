import Like from '../controllers/like';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/like/:type/:id').post(wrapAsync(Like.post));
	api.route('/like/:type/:id').delete(wrapAsync(Like.delete));
};
