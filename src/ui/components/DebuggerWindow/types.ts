import type { WindowPosition } from '../../../app/constants';

export interface DebuggerWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  timeLabel: string;
}
