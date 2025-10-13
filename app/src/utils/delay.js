const delay = function (ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export default delay;
