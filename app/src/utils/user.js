export const getCurrentUser = () => {
	let currentUser;
	try {
		const authedUser = localStorage['authedUser'];
		currentUser = JSON.parse(authedUser);
	} catch {
		// XXX
	}
	return currentUser;
};
