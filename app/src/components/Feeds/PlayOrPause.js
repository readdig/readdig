import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as PauseIcon } from '../../images/player/pause.svg';
import { ReactComponent as PlayIcon } from '../../images/player/play.svg';

const PlayOrPause = ({ article = {} }) => {
	const dispatch = useDispatch();
	const inPlayer = useSelector((state) => state.player && state.player.id === article.id);
	const isPlaying = useSelector(
		(state) => state.player && state.player.playing && state.player.id === article.id,
	);

	const playOrPauseEpisode = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (inPlayer && isPlaying) {
			dispatch({ type: 'PAUSE_EPISODE' });
		} else if (inPlayer) {
			dispatch({ type: 'RESUME_EPISODE' });
		} else {
			dispatch({ type: 'PLAY_EPISODE', article });
		}
	};

	return (
		<div className={inPlayer ? 'pause' : 'play'} onClick={playOrPauseEpisode}>
			{inPlayer && isPlaying ? <PauseIcon /> : <PlayIcon />}
		</div>
	);
};

export default PlayOrPause;
