import Debug from '../controllers/debug';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/debug/og').post(wrapAsync(Debug.og));
	api.route('/debug/feed').post(wrapAsync(Debug.feed));
	api.route('/debug/discover').post(wrapAsync(Debug.discover));
};
