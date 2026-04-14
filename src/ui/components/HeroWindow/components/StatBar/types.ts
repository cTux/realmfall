import type { MouseEvent as ReactMouseEvent } from 'react';
import type { TooltipLine } from '../../../../tooltips';

export interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: 'hp' | 'mana' | 'xp' | 'hunger' | 'thirst';
  description?: string;
  onHoverDetail?: (
    event: ReactMouseEvent<HTMLElement>,
    title: string,
    lines: TooltipLine[],
    borderColor?: string,
  ) => void;
  onLeaveDetail?: () => void;
}
