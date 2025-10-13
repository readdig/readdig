import Unread from '../controllers/unread';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/unread/clear').post(wrapAsync(Unread.post));
};
