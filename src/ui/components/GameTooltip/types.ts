import type { MutableRefObject } from 'react';
import type { TooltipLine } from '../../tooltips';

export interface GameTooltipData {
  title: string;
  lines: TooltipLine[];
  x: number;
  y: number;
  borderColor?: string;
  followCursor?: boolean;
}

export interface TooltipPosition {
  x: number;
  y: number;
}

export interface RenderedTooltipState {
  tooltip: GameTooltipData;
  visible: boolean;
}

export interface GameTooltipProps {
  tooltip: GameTooltipData | null;
  positionRef?: MutableRefObject<TooltipPosition | null>;
}
