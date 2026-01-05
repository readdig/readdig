import { ParseOG } from '../parsers/og';
import { ParseFeed } from '../parsers/feed';
import { DiscoverFeed } from '../parsers/discovery';
import { ParseContent } from '../parsers/content';
import { isValidOGUrl, normalizeUrl } from '../utils/urls';
import { logger } from '../utils/logger';

exports.og = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const { url } = req.body;

	if (!url) {
		return res.status(400).json('URL is required');
	}

	if (!isValidOGUrl(normalizeUrl(url))) {
		return res.status(400).json('Invalid URL');
	}

	try {
		const result = await ParseOG(url);
		return res.json(result);
	} catch (err) {
		logger.error(`Debug OG error: ${err.message}`);
		return res.status(500).json(err.message);
	}
};

exports.feed = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const { url } = req.body;

	if (!url) {
		return res.status(400).json('URL is required');
	}

	if (!isValidOGUrl(normalizeUrl(url))) {
		return res.status(400).json('Invalid URL');
	}

	try {
		const result = await ParseFeed(url);
		return res.json(result);
	} catch (err) {
		logger.error(`Debug Feed error: ${err.message}`);
		return res.status(500).json(err.message);
	}
};

exports.discover = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const { url } = req.body;

	if (!url) {
		return res.status(400).json('URL is required');
	}

	if (!isValidOGUrl(normalizeUrl(url))) {
		return res.status(400).json('Invalid URL');
	}

	try {
		const result = await DiscoverFeed(url);
		return res.json({ feedUrl: result || null });
	} catch (err) {
		logger.error(`Debug Discover error: ${err.message}`);
		return res.status(500).json(err.message);
	}
};

exports.fulltext = async (req, res) => {
	if (!req.User || !req.User.admin) {
		return res.status(403).json('You must be an admin to perform this action.');
	}

	const { url } = req.body;

	if (!url) {
		return res.status(400).json('URL is required');
	}

	if (!isValidOGUrl(normalizeUrl(url))) {
		return res.status(400).json('Invalid URL');
	}

	try {
		const result = await ParseContent(url);
		return res.json(result);
	} catch (err) {
		logger.error(`Debug Fulltext error: ${err.message}`);
		return res.status(500).json(err.message);
	}
};
