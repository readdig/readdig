import Post from '../controllers/post';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/posts').get(wrapAsync(Post.list));
};
