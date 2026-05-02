import type { HexCoord } from '../../../game/stateTypes';
import type { TooltipState } from '../types';

export interface WorldHoverSnapshot {
  analysisVersion: number;
  target: HexCoord | null;
  clickable: boolean;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  tooltip: TooltipState | null;
  tooltipKey: string | null;
}

export function createEmptyWorldHoverSnapshot(
  analysisVersion = 0,
): WorldHoverSnapshot {
  return {
    analysisVersion,
    target: null,
    clickable: false,
    hoveredMove: null,
    hoveredSafePath: null,
    tooltip: null,
    tooltipKey: null,
  };
}
