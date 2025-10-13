const isDispatch = (fn) => {
	return (
		fn &&
		(Object.prototype.toString.call(fn) === '[object Function]' ||
			typeof fn === 'function' ||
			fn instanceof Function)
	);
};

export default isDispatch;
