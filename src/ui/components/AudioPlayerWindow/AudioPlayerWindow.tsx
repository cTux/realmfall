import { memo, Suspense } from 'react';
import { t } from '../../../i18n';
import { WINDOW_LABELS } from '../../windowLabels';
import { WindowLoadingState } from '../WindowLoadingState';
import { createLazyWindowComponent } from '../lazyWindowComponent';
import { WindowShell } from '../WindowShell';
import type { AudioPlayerWindowProps } from './types';
import styles from './styles.module.scss';

const AudioPlayerWindowContent = createLazyWindowComponent<
  Parameters<
    (typeof import('./AudioPlayerWindowContent'))['AudioPlayerWindowContent']
  >[0]
>(() =>
  import('./AudioPlayerWindowContent').then((module) => ({
    default: module.AudioPlayerWindowContent,
  })),
);

export const AudioPlayerWindow = memo(function AudioPlayerWindow({
  area,
  canPlay,
  currentTime,
  currentTrack,
  currentTrackIndex,
  duration,
  isPlaying,
  onClose,
  onMove,
  onNextTrack,
  onPlayPause,
  onPreviousTrack,
  onSeek,
  playlist,
  position,
  progress,
  visible,
}: AudioPlayerWindowProps) {
  return (
    <WindowShell
      title={WINDOW_LABELS.audioPlayer.plain}
      hotkeyLabel={WINDOW_LABELS.audioPlayer}
      position={position}
      onMove={onMove}
      visible={visible}
      onClose={onClose}
      className={styles.window}
      titleClassName={styles.windowTitle}
      resizeBounds={{ minWidth: 360, minHeight: 280 }}
      closeButtonTooltip={t('ui.audioPlayer.closeTooltip')}
    >
      <Suspense fallback={<WindowLoadingState />}>
        <AudioPlayerWindowContent
          area={area}
          canPlay={canPlay}
          currentTime={currentTime}
          currentTrack={currentTrack}
          currentTrackIndex={currentTrackIndex}
          duration={duration}
          isPlaying={isPlaying}
          onNextTrack={onNextTrack}
          onPlayPause={onPlayPause}
          onPreviousTrack={onPreviousTrack}
          onSeek={onSeek}
          playlist={playlist}
          progress={progress}
        />
      </Suspense>
    </WindowShell>
  );
});
