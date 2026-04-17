import type { WindowPosition } from '../../../app/constants';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export interface DebuggerWindowProps extends WindowDetailTooltipHandlers {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  worldTimeMs?: number;
}
