import type { TooltipLine } from '../../tooltips';

export interface GameTooltipData {
  title: string;
  lines: TooltipLine[];
  x: number;
  y: number;
  borderColor?: string;
}

export interface RenderedTooltipState {
  tooltip: GameTooltipData;
  visible: boolean;
}

export interface GameTooltipProps {
  tooltip: GameTooltipData | null;
}
