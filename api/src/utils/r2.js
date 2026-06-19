import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';

import { config } from '../config';

const { endpoint, bucket, accessKeyId, secretAccessKey } = config.r2;

// R2 acts purely as the storage backend behind the /images endpoints (replacing
// local disk). When not fully configured, download.js falls back to local disk.
export const r2Enabled = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

const client = r2Enabled
	? new S3Client({
			region: 'auto',
			endpoint,
			credentials: { accessKeyId, secretAccessKey },
	  })
	: null;

// Guard: these helpers must only run when r2Enabled is true. Throwing here turns
// accidental misuse (null client) into a clear error that callers already catch.
const requireClient = () => {
	if (!client) {
		throw new Error('R2 is not configured.');
	}
	return client;
};

// Find an existing object by key prefix. Mirrors the local `readdir` + startsWith
// match, where the file suffix isn't known ahead of time. Returns the full key
// (suffix included) or null.
export const r2FindByPrefix = async (prefix) => {
	const resp = await requireClient().send(
		new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1 }),
	);
	return resp.Contents && resp.Contents.length ? resp.Contents[0].Key : null;
};

export const r2Put = async (key, body, contentType) => {
	await requireClient().send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	);
};

// Read an object's bytes (mirrors reading the local file before serving).
export const r2GetBuffer = async (key) => {
	const resp = await requireClient().send(
		new GetObjectCommand({ Bucket: bucket, Key: key }),
	);
	const bytes = await resp.Body.transformToByteArray();
	return Buffer.from(bytes);
};
