const TOOLTIP_OFFSET_PX = 12;
const TOOLTIP_ESTIMATED_WIDTH_PX = 320;

export type TooltipPlacement = 'left' | 'right' | 'top';

export interface TooltipAnchorRect {
  left: number;
  right: number;
  top: number;
}

export function getTooltipPlacementForRect(
  rect: TooltipAnchorRect,
  viewportWidth = window.innerWidth,
) {
  const placement: TooltipPlacement =
    rect.right + TOOLTIP_OFFSET_PX + TOOLTIP_ESTIMATED_WIDTH_PX > viewportWidth
      ? 'left'
      : 'right';

  return {
    x:
      placement === 'left'
        ? rect.left - TOOLTIP_OFFSET_PX
        : rect.right + TOOLTIP_OFFSET_PX,
    y: rect.top,
    placement,
  };
}
