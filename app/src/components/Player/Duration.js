import dayjs from '../../utils/dayjs';

function pad(string) {
	return ('0' + string).slice(-2);
}

export default function Duration({ duration, played }) {
	const playedDuration = dayjs.duration(duration * played, 'seconds');
	const totalDuration = dayjs.duration(duration, 'seconds');

	return `${pad(playedDuration.hours())}:${pad(playedDuration.minutes())}:${pad(
		playedDuration.seconds(),
	)} / ${pad(totalDuration.hours())}:${pad(totalDuration.minutes())}:${pad(
		totalDuration.seconds(),
	)}`;
}
