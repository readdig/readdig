import path from 'path';
import { promises as fs, existsSync } from 'fs';
import mime from 'mime';

import { config } from '../config';
import { r2Enabled, r2Put, r2Get } from './r2';

export { r2Enabled };

// Image storage backend: Cloudflare R2 when configured, otherwise local disk.
// All backend-specific logic lives here; callers use the three functions below.
// An "id" is the R2 object key or the local file path.

const dirPath = (folder, dir) => path.resolve(config.static.path, folder, dir);
export const storedId = (folder, dir, name) =>
	r2Enabled ? `${folder}/${dir}/${name}` : null;

// Find a stored image on local disk by prefix because files keep their extension.
// R2 callers use `storedId` + direct GetObject instead.
export const findStored = async (folder, dir, name) => {
	try {
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
		const key = `${folder}/${dir}/${name}`;
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
export const readStored = async (id) => {
	if (r2Enabled) {
		return await r2Get(id);
	}

	const buffer = await fs.readFile(id);
	const suffix = path.extname(id).slice(1);
	return {
		buffer,
		contentType: mime.getType(suffix),
		suffix,
	};
};
