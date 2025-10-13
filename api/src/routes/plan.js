import Plan from '../controllers/plan';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/plans').get(wrapAsync(Plan.list));
	api.route('/plans').post(wrapAsync(Plan.post));
	api.route('/plans/:planId').get(wrapAsync(Plan.get));
	api.route('/plans/:planId').put(wrapAsync(Plan.put));
	api.route('/plans/:planId').delete(wrapAsync(Plan.delete));
};
