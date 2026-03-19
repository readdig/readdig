import Article from '../controllers/article';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/articles').get(wrapAsync(Article.list));
	api.route('/articles/read').post(wrapAsync(Article.read));
	api.route('/articles/:articleId').get(wrapAsync(Article.get));
	api.route('/articles/:articleId').delete(wrapAsync(Article.remove));
};
