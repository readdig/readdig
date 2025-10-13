import Image from '../controllers/image';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/images/feed/:feedId').get(wrapAsync(Image.feed));
	api.route('/images/article/:articleId').get(wrapAsync(Image.article));
};
