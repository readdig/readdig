import Star from '../controllers/star';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/stars').post(wrapAsync(Star.post));
	api.route('/stars/:articleId').put(wrapAsync(Star.put));
	api.route('/stars/:articleId').delete(wrapAsync(Star.delete));
};
