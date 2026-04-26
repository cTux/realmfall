import type { MouseEvent as ReactMouseEvent } from 'react';
import type { TooltipLine } from '../tooltips';

export interface WindowDetailTooltipHandlers {
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
