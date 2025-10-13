import config from '../config';

export const updateMetadata = (player) => {
	if ('mediaSession' in navigator) {
		navigator.mediaSession.metadata = new window.MediaMetadata({
			title: player.title,
			artist: player.feed.title,
			artwork: [
				{
					src: `${config.api.url}/images/article/${player.id}?w=96&h=96`,
					sizes: '96x96',
					type: 'image/jpeg',
				},
				{
					src: `${config.api.url}/images/article/${player.id}?w=128&h=128`,
					sizes: '128x128',
					type: 'image/jpeg',
				},
				{
					src: `${config.api.url}/images/article/${player.id}?w=192&h=192`,
					sizes: '192x192',
					type: 'image/jpeg',
				},
				{
					src: `${config.api.url}/images/article/${player.id}?w=256&h=256`,
					sizes: '256x256',
					type: 'image/jpeg',
				},
				{
					src: `${config.api.url}/images/article/${player.id}?w=384&h=384`,
					sizes: '384x384',
					type: 'image/jpeg',
				},
				{
					src: `${config.api.url}/images/article/${player.id}?w=512&h=512`,
					sizes: '512x512',
					type: 'image/jpeg',
				},
			],
		});
	}
};

export const updateActionHandlers = (actionHandlers) => {
	for (const [action, handler] of actionHandlers) {
		try {
			navigator.mediaSession.setActionHandler(action, handler);
		} catch (err) {
			console.log(`The media session action "${action}" is not supported yet.`);
		}
	}
};

export const updatePositionState = (played, duration, playbackRate) => {
	if ('setPositionState' in navigator.mediaSession) {
		navigator.mediaSession.setPositionState({
			position: played,
			duration: duration,
			playbackRate: playbackRate,
		});
	}
};
