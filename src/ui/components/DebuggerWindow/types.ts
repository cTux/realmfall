import type { WindowPosition } from '../../../app/constants';
import type { TooltipLine } from '../../tooltips';

export interface DebuggerWindowProps {
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  visible?: boolean;
  onClose?: () => void;
  worldTimeMs: number;
  onHoverDetail?: (
    event: React.MouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
