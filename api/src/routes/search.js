import Search from '../controllers/search';

module.exports = (api) => {
	api.route('/search').get(Search.get);
};
