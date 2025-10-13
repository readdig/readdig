import Email from '../controllers/email';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/email/:userId').get(wrapAsync(Email.get));
	api.route('/email/:userId').post(wrapAsync(Email.post));
};
