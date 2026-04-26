import type { ReactNode } from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { WindowDetailTooltipHandlers } from '../windowTooltipTypes';

export type WindowStackLayer = 'standard' | 'modal';

export interface WindowResizeBounds {
  minWidth: number;
  minHeight: number;
}

export interface DraggableWindowProps extends WindowDetailTooltipHandlers {
  title: ReactNode;
  position: WindowPosition;
  onMove: (position: WindowPosition) => void;
  children: ReactNode;
  titleClassName?: string;
  bodyClassName?: string;
  headerActions?: ReactNode;
  className?: string;
  visible?: boolean;
  externalUnmount?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  resizeBounds?: WindowResizeBounds;
  closeButtonTooltip?: string;
  stackLayer?: WindowStackLayer;
}
