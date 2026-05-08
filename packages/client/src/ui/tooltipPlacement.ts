export type { TooltipPlacement } from '@realmfall/ui';
export { getTooltipPlacementForRect } from '@realmfall/ui';

export interface TooltipAnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
}
