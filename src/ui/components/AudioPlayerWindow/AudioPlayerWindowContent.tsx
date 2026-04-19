import { t } from '../../../i18n';
import { type AudioPlayerWindowProps } from './types';
import styles from './styles.module.scss';

type AudioPlayerWindowContentProps = Pick<
  AudioPlayerWindowProps,
  | 'area'
  | 'canPlay'
  | 'currentTime'
  | 'currentTrack'
  | 'currentTrackIndex'
  | 'duration'
  | 'isPlaying'
  | 'onNextTrack'
  | 'onPlayPause'
  | 'onPreviousTrack'
  | 'onSeek'
  | 'playlist'
  | 'progress'
>;

export function AudioPlayerWindowContent({
  area,
  canPlay,
  currentTime,
  currentTrack,
  currentTrackIndex,
  duration,
  isPlaying,
  onNextTrack,
  onPlayPause,
  onPreviousTrack,
  onSeek,
  playlist,
  progress,
}: AudioPlayerWindowContentProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.nowPlaying}>
        <div className={styles.nowPlayingMeta}>
          <span className={styles.areaBadge}>
            {t(`ui.audioPlayer.area.${area}`)}
          </span>
          <strong className={styles.trackTitle}>
            {currentTrack?.label ?? t('ui.audioPlayer.empty')}
          </strong>
        </div>
        <div className={styles.timeRow}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          className={styles.progress}
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(progress * 1000)}
          disabled={!canPlay}
          aria-label={t('ui.audioPlayer.progress')}
          onChange={(event) => onSeek(Number(event.currentTarget.value) / 1000)}
        />
      </div>
      <div className={styles.controls}>
        <button type="button" disabled={!canPlay} onClick={onPreviousTrack}>
          {t('ui.audioPlayer.previous')}
        </button>
        <button type="button" disabled={!canPlay} onClick={onPlayPause}>
          {isPlaying ? t('ui.audioPlayer.pause') : t('ui.audioPlayer.play')}
        </button>
        <button type="button" disabled={!canPlay} onClick={onNextTrack}>
          {t('ui.audioPlayer.next')}
        </button>
      </div>
      <div className={styles.playlistPanel}>
        <div className={styles.playlistHeader}>
          {t('ui.audioPlayer.playlistTitle', { count: playlist.length })}
        </div>
        <ol className={styles.playlist}>
          {playlist.map((track, index) => (
            <li
              key={track.id}
              className={styles.playlistItem}
              data-current={track.id === currentTrack?.id}
            >
              <span className={styles.trackIndex}>{index + 1}</span>
              <span className={styles.trackLabel}>{track.label}</span>
              {index === currentTrackIndex ? (
                <span className={styles.trackState}>
                  {isPlaying
                    ? t('ui.audioPlayer.nowPlaying')
                    : t('ui.audioPlayer.pausedState')}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
