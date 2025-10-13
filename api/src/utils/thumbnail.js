import sharp from 'sharp';

export const svgIcon = (str) => {
	return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
					<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="120" height="120" viewBox="0 0 120 120">
						<g>
							<defs>
								<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stop-color="#F4F6F6"/>
									<stop offset="100%" stop-color="#D7DBDD"/>
								</linearGradient>
							</defs>
							<rect fill="url(#bg)" x="0" y="0" width="120" height="120"/>
							<text x="50%" y="50%" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" fill="#626567" font-size="72" font-weight="400">${str
								.charAt(0)
								.toUpperCase()}</text>
						</g>
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
