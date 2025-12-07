import { unless } from 'express-unless';
import { userSubscription } from './subscription';

export const subscriptionMiddleware = () => {
	const middleware = async (req, res, next) => {
		if (req.User && !req.User.admin && !req.User.free) {
			try {
				const subscription = await userSubscription(req.user.sub);
				if (subscription && subscription.expired) {
					return res.status(402).json('This account subscription plan has expired.');
				}
			} catch (err) {
				next(err);
			}
		}

		next();
	};

	middleware.unless = unless;

	return middleware;
};
