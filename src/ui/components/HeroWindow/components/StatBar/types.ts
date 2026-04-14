import type { WindowDetailTooltipHandlers } from '../../../windowTooltipTypes';

export interface StatBarProps extends WindowDetailTooltipHandlers {
  label: string;
  value: number;
  max: number;
  color: 'hp' | 'mana' | 'xp' | 'hunger' | 'thirst';
  description?: string;
}
