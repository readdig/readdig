import sharp from 'sharp';

export const svgIcon = (str) => {
	const title = (str || '').trim();
	const letter = title ? title.charAt(0).toUpperCase() : '?';

	// Stable, pleasant color derived from the title, so each feed keeps its own hue.
	let hash = 0;
	for (let i = 0; i < title.length; i++) {
		hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
	}
	const hue = hash % 360;
	const top = `hsl(${hue}, 64%, 58%)`;
	const bottom = `hsl(${(hue + 28) % 360}, 62%, 46%)`;

	return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="${top}"/>
			<stop offset="100%" stop-color="${bottom}"/>
		</linearGradient>
	</defs>
	<rect width="120" height="120" fill="url(#bg)"/>
	<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="64" font-weight="400">${letter}</text>
</svg>`);
};

export const thumbnail = async (input, width, height, fileOut) => {
	const image = sharp(input);
	const metadata = await image.metadata();
	const fit =
		metadata.width < width || metadata.height < height
			? sharp.fit.contain
			: sharp.fit.cover;
	const resize = image
		.flatten({
			background: { r: 255, g: 255, b: 255 },
		})
		.resize({
			width,
			height,
			fit,
			background: { r: 255, g: 255, b: 255 },
		});

	if (fileOut) {
		return await resize.toFile(fileOut);
	} else {
		return await resize.toBuffer();
	}
};
