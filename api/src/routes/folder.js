import Folder from '../controllers/folder';
import { wrapAsync } from '../utils/controllers';

module.exports = (api) => {
	api.route('/folders').get(wrapAsync(Folder.list));
	api.route('/folders').post(wrapAsync(Folder.post));
	api.route('/folders').delete(wrapAsync(Folder.delete));
	api.route('/folders/:folderId').put(wrapAsync(Folder.put));
};
