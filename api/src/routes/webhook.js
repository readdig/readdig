import Webhook from '../controllers/webhook';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/webhooks').post(wrapAsync(Webhook.post));
};
