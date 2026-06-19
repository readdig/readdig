import path from 'path';
import { promises as fs, existsSync } from 'fs';

import { config } from '../config';
import { r2Enabled, r2FindByPrefix, r2Put, r2GetBuffer } from './r2';

// Image storage backend: Cloudflare R2 when configured, otherwise local disk.
// All backend-specific logic lives here; callers use the three functions below.
// An "id" is the R2 object key or the local file path.

const dirPath = (folder, dir) => path.resolve(config.static.path, folder, dir);

// Find a stored image by name prefix (the suffix isn't known up front). Returns
// the id, or null. Never throws — a backend error degrades to "not found".
export const findStored = async (folder, dir, name) => {
	try {
		if (r2Enabled) {
			return await r2FindByPrefix(`${folder}/${dir}/${name}`);
		}
		const base = dirPath(folder, dir);
		const files = await fs.readdir(base);
		const hit = files.find((f) => f.startsWith(name));
		return hit ? path.join(base, hit) : null;
	} catch (err) {
		return null;
	}
};

// Store image bytes and return the id.
export const putStored = async (folder, dir, name, suffix, buffer, contentType) => {
	if (r2Enabled) {
		const key = `${folder}/${dir}/${name}.${suffix}`;
		await r2Put(key, buffer, contentType);
		return key;
	}
	const base = dirPath(folder, dir);
	if (!existsSync(base)) {
		await fs.mkdir(base, { recursive: true });
	}
	const filePath = path.join(base, `${name}.${suffix}`);
	await fs.writeFile(filePath, buffer);
	return filePath;
};

// Read stored image bytes by id.
export const readStored = (id) => (r2Enabled ? r2GetBuffer(id) : fs.readFile(id));
