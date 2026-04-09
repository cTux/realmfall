import type { TooltipLine } from '../../tooltips';

export interface GameTooltipData {
  title: string;
  lines: TooltipLine[];
  x: number;
  y: number;
}

export interface GameTooltipProps {
  tooltip: GameTooltipData | null;
}
