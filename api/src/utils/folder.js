import { db } from '../db';
import { folders } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const isFolderId = async (userId, folderIds) => {
	if (folderIds && folderIds.length) {
		const validIds = folderIds.filter((id) => id);
		if (validIds.length === 0) {
			return false;
		}

		const folderList = await db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.userId, userId), inArray(folders.id, validIds)));

		if (folderList.length !== validIds.length) {
			return false;
		}
		return true;
	}
	return false;
};
