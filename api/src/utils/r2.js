import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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

// Read an object's bytes and content type.
export const r2Get = async (key) => {
	const resp = await requireClient().send(
		new GetObjectCommand({ Bucket: bucket, Key: key }),
	);
	const bytes = await resp.Body.transformToByteArray();
	return {
		buffer: Buffer.from(bytes),
		contentType: resp.ContentType,
	};
};
