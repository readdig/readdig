import Share from '../controllers/share';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/shares/:shareId').get(wrapAsync(Share.get));
};
