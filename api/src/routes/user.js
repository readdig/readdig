import User from '../controllers/user';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/users').get(wrapAsync(User.list));
	api.route('/users/:userId').get(wrapAsync(User.get));
	api.route('/users/:userId').put(wrapAsync(User.put));
	api.route('/users/:userId').delete(wrapAsync(User.delete));
	api.route('/users/history/:userId').delete(wrapAsync(User.history));
};
