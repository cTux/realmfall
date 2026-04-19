import type { WindowPosition } from '../../../app/constants';
import type { MusicArea, MusicTrack } from '../../../app/audio/musicLibrary';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface AudioPlayerWindowProps extends WindowDetailTooltipHandlers {
  area: MusicArea;
  canPlay: boolean;
  currentTime: number;
  currentTrack: MusicTrack | null;
  currentTrackIndex: number;
  duration: number;
  isPlaying: boolean;
  onMove: (position: WindowPosition) => void;
  onClose?: () => void;
  onNextTrack: () => void;
  onPlayPause: () => void;
  onPreviousTrack: () => void;
  onSeek: (progress: number) => void;
  playlist: MusicTrack[];
  position: WindowPosition;
  progress: number;
  visible?: boolean;
}
