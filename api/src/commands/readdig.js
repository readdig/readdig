#!/usr/bin/env babel-node
import program from 'commander';

import { config } from '../config';
import { isValidOGUrl, normalizeUrl } from '../utils/urls';
import { ParseOG } from '../parsers/og';
import { ParseFeed } from '../parsers/feed';
import { DiscoverFeed } from '../parsers/discovery';
import { ogProcessor } from '../workers/og';
import { feedProcessor } from '../workers/feed';
import { isUUID } from '../utils/validation';

async function main() {
	program
		.version(config.version)
		.option('--og <value>', 'Debug OG')
		.option('--feed <value>', 'Debug RSS feeds')
		.option('--discover <value>', 'Debug RSS discovery')
		.parse(process.argv);

	const options = program.opts();

	if (options.og) {
		if (isValidOGUrl(normalizeUrl(options.og))) {
			const feedOG = await ParseOG(options.og);
			console.log(`OG info ${JSON.stringify(feedOG)}`);
		} else if (isUUID(options.og)) {
			await ogProcessor({ data: { feed: options.og } });
		} else {
			console.error(`OG arg invalid`);
		}
	}

	if (options.feed) {
		if (isValidOGUrl(normalizeUrl(options.feed))) {
			const feed = await ParseFeed(options.feed);
			console.log(`Feed info ${JSON.stringify(feed)}`);
		} else if (isUUID(options.feed)) {
			await feedProcessor({ data: { feed: options.feed } });
		} else {
			console.error(`Feed arg invalid`);
		}
	}

	if (options.discover) {
		if (normalizeUrl(options.discover)) {
			const feedUrl = await DiscoverFeed(options.discover);
			console.log(`Discover feed URL ${feedUrl}`);
		} else {
			console.error(`Discover arg invalid`);
		}
	}
}

main()
	.then(() => {
		process.exit(0);
	})
	.catch((err) => {
		console.error(`failed with err ${err}`);
		process.exit(1);
	});
