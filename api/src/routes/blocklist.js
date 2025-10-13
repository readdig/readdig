import Blocklist from '../controllers/blocklist';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/blocklist').get(wrapAsync(Blocklist.get));
	api.route('/blocklist').put(wrapAsync(Blocklist.put));
};
