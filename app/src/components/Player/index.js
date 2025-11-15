import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import classNames from 'classnames';
import { sort } from 'fast-sort';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Volume from './Volume';
import Duration from './Duration';
import Time from '../Time';
import Image from '../Image';
import { updateMetadata, updateActionHandlers } from '../../utils/metadata';
import { playListen } from '../../api/listen';

import { ReactComponent as RewindIcon } from '../../images/player/rewind.svg';
import { ReactComponent as ForwardIcon } from '../../images/player/forward.svg';
import { ReactComponent as PauseIcon } from '../../images/player/pause.svg';
import { ReactComponent as PlayIcon } from '../../images/player/play.svg';
import { ReactComponent as CloseIcon } from '../../images/player/close.svg';
import { ReactComponent as RepeatIcon } from '../../images/player/repeat.svg';
import { ReactComponent as RepeatOffIcon } from '../../images/player/repeat-off.svg';
import { ReactComponent as PodcastIcon } from '../../images/icons/podcast.svg';

const Player = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const [volume, setVolume] = useState(0.6);
	const [played, setPlayed] = useState(0);
	const [duration, setDuration] = useState(0);
	const [playbackRate, setPlaybackRate] = useState(1.0);
	const [loop, setLoop] = useState(false);
	const [seeking, setSeeking] = useState(false);

	const player = useRef();
	const lastSent = useRef(new Date().valueOf());
	const playbackSpeedOptions = [1, 1.25, 1.5, 1.75, 2];

	const articles = useSelector((state) => state.articles || {});
	const currentEpisode = useSelector((state) =>
		state.article &&
		state.article.feed.type === 'podcast' &&
		state.article.type === 'episode'
			? state.article
			: {},
	);
	const orderEpisodes = sort(
		Object.values(articles).filter(
			(e) => e.feed.type === 'podcast' && e.type === 'episode',
		),
	)
		.desc((a) => a.orderedAt)
		.map((a) => a.id);

	const defaultEpisode = articles[orderEpisodes[0]]
		? { ...articles[orderEpisodes[0]], attachments: [{ url: '/static/1-second.mp3' }] }
		: null;
	const episode = useSelector(
		(state) => state.player || defaultEpisode || currentEpisode,
	);
	const episodeId = episode && episode.id ? episode.id : null;
	const attachmentUrl = episode && episode.attachments ? episode.attachments : null;

	useEffect(() => {
		lastSent.current = new Date().valueOf();
		setPlayed(0);
		setDuration(0);
		setPlaybackRate(1);
	}, [episodeId, attachmentUrl]);

	const updatePlayListen = (open) => {
		playListen({
			open,
			played,
			duration,
			articleId: episode.id,
			playing: episode.playing,
		});
	};

	const pause = () => dispatch({ type: 'PAUSE_EPISODE' });
	const play = () => dispatch({ type: 'RESUME_EPISODE' });
	const closePlayer = () => dispatch({ type: 'CLOSE_PLAYER' });
	const playEpisode = (episode) => {
		dispatch({
			article: episode,
			type: 'PLAY_EPISODE',
		});
	};

	const togglePlayPause = () => {
		episode.playing ? pause() : play();
	};

	const toggleLoop = () => {
		setLoop(!loop);
	};

	const playClose = () => {
		closePlayer();
		updatePlayListen(false);
	};

	const skipForward = () => {
		setSeeking(false);
		if (player.current && player.current.currentTime !== undefined) {
			const newTime = player.current.currentTime + 30;
			player.current.currentTime = Math.min(newTime, player.current.duration || newTime);
		}
	};

	const skipRewind = () => {
		setSeeking(false);
		if (player.current && player.current.currentTime !== undefined) {
			const newTime = player.current.currentTime - 30;
			player.current.currentTime = Math.max(newTime, 0);
		}
	};

	const setPlaybackSpeed = () => {
		const nextSpeed =
			playbackSpeedOptions[
				(playbackSpeedOptions.indexOf(playbackRate) + 1) % playbackSpeedOptions.length
			];
		setPlaybackRate(nextSpeed);
	};

	const prevTrack = () => {
		updatePlayListen(false);

		const currentIndex = orderEpisodes.findIndex((item) => episode.id === item);

		if (currentIndex - 1 >= 0) {
			const articleId = orderEpisodes[currentIndex - 1];
			const article = articles[articleId];
			playEpisode(article);
		} else {
			pause();
		}
	};

	const nextTrack = () => {
		updatePlayListen(false);

		const currentIndex = orderEpisodes.findIndex((item) => episode.id === item);

		if (currentIndex + 1 !== orderEpisodes.length) {
			const articleId = orderEpisodes[currentIndex + 1];
			const article = articles[articleId];
			playEpisode(article);
		} else {
			pause();
		}
	};

	const fastSeek = (e) => {
		setSeeking(false);
		if (player.current && e.seekTime !== undefined) {
			player.current.currentTime = e.seekTime * (player.current.duration || 0);
		}
	};

	const seekTo = (e) => {
		setSeeking(false);
		if (player.current && player.current.duration) {
			const fraction = parseFloat(e.nativeEvent.offsetX / e.target.clientWidth);
			player.current.currentTime = fraction * player.current.duration;
		}
	};

	const playProgress = () => {
		if (!seeking && player.current) {
			if (!player.current.duration) return;

			const currentTime = player.current.currentTime || 0;
			const duration = player.current.duration || 1;
			const played = duration > 0 ? currentTime / duration : 0;

			setPlayed(played);
			const currentTimeMs = new Date().valueOf();
			if (currentTimeMs - lastSent.current >= 10000) {
				lastSent.current = currentTimeMs;
				updatePlayListen(true);
			}
		}
	};

	const playDuration = () => {
		if (player.current && player.current.duration) {
			setDuration(player.current.duration);
		}
	};

	const playVolume = (volume) => {
		setVolume(volume);
	};

	const onPlay = () => {
		updatePlayListen(true);
	};

	const onPause = () => {
		updatePlayListen(true);
	};

	const onError = () => {
		pause();
	};

	return (
		<>
			{episode && episode.id && (
				<div className={classNames('player', { open: episode.open })}>
					<div className="left">
						<Image relative={true} src={`/images/article/${episode.id}?w=120&h=120`} />
						<div className="loop" onClick={toggleLoop}>
							{loop ? <RepeatIcon /> : <RepeatOffIcon />}
						</div>
						<div className="rewind" onClick={skipRewind}>
							<RewindIcon />
						</div>
						{episode.playing ? (
							<div className="pause" onClick={togglePlayPause}>
								<PauseIcon />
							</div>
						) : (
							<div className="play" onClick={togglePlayPause}>
								<PlayIcon />
							</div>
						)}
						<div className="forward" onClick={skipForward}>
							<ForwardIcon />
						</div>
						<div className="speed" onClick={setPlaybackSpeed}>
							{playbackRate}x
						</div>
					</div>
					<div className="middle">
						<div className="media">
							<div className="title">{episode.title}</div>
							<div className="info">
								<span className="episode">{episode.feed.title}</span>
								<Time className="datetime" value={episode.datePublished} />
							</div>
						</div>
						<div className="progress">
							<div className="progress-bar" style={{ width: `${played * 100}%` }} />
							<div className="progress-bar-click-catcher" onClick={seekTo} />
						</div>
						<div className="duration">
							<Duration played={played} duration={duration} />
						</div>
					</div>
					<div className="right">
						<div className="volume">
							<Volume value={volume} onChange={playVolume} />
						</div>
						<Link
							className="next"
							title={episode.feed.title}
							to={`/feed/${episode.feed.id}`}
						>
							<PodcastIcon />
						</Link>
						<div className="click" title={t('Close player')} onClick={playClose}>
							<CloseIcon />
						</div>
					</div>
					<ReactPlayer
						key={episode.id}
						width="0"
						height="0"
						ref={player}
						src={
							episode.attachments && episode.attachments.length > 0
								? episode.attachments[0].url
								: null
						}
						loop={loop}
						volume={volume}
						playing={episode.playing}
						playbackRate={playbackRate}
						onReady={() => {
							updateMetadata(episode);
							updateActionHandlers([
								['play', () => play()],
								['pause', () => pause()],
								['stop', () => playClose()],
								['previoustrack', () => prevTrack()],
								['nexttrack', () => nextTrack()],
								['seekbackward', () => skipRewind()],
								['seekforward', () => skipForward()],
								['seekto', (event) => fastSeek(event)],
							]);
						}}
						onPlay={onPlay}
						onPause={onPause}
						onEnded={nextTrack}
						onTimeUpdate={playProgress}
						onDurationChange={playDuration}
						onError={onError}
					/>
				</div>
			)}
		</>
	);
};

export default Player;
