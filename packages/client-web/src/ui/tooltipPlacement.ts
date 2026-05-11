export type { TooltipPlacement } from '@realmfall/ui-react';
export { getTooltipPlacementForRect } from '@realmfall/ui-react';

export interface TooltipAnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
}
