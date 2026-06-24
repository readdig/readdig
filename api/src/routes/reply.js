import Reply from '../controllers/reply';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/replies/:articleId').get(wrapAsync(Reply.get));
};
