import { createHash } from 'crypto';

export default function computeHash(data) {
	return createHash('md5').update(data).digest('hex');
}
