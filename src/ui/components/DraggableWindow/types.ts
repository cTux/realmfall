import type { ReactNode } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { TooltipLine } from '../../tooltips';

export interface DraggableWindowProps {
  title: ReactNode;
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
  titleClassName?: string;
  headerActions?: ReactNode;
  className?: string;
  visible?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  resizeBounds?: {
    minWidth: number;
    minHeight: number;
  };
  onHoverDetail?: (
    event: React.MouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
  closeButtonTooltip?: string;
}
