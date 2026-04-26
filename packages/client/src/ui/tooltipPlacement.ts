const TOOLTIP_OFFSET_PX = 12;
const TOOLTIP_EDGE_PADDING_PX = 12;
const TOOLTIP_ESTIMATED_WIDTH_PX = 260;
const TOOLTIP_ESTIMATED_HEIGHT_PX = 180;

export type TooltipPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface TooltipAnchorRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
}

interface TooltipPlacementOptions {
  preferredPlacements?: TooltipPlacement[];
  tooltipWidth?: number;
  tooltipHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

interface TooltipPosition {
  x: number;
  y: number;
  placement: TooltipPlacement;
}

const DEFAULT_PLACEMENTS: TooltipPlacement[] = [
  'right',
  'left',
  'top',
  'bottom',
];

export function getTooltipPlacementForRect(
  rect: TooltipAnchorRect,
  {
    preferredPlacements = DEFAULT_PLACEMENTS,
    tooltipWidth = TOOLTIP_ESTIMATED_WIDTH_PX,
    tooltipHeight = TOOLTIP_ESTIMATED_HEIGHT_PX,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
  }: TooltipPlacementOptions = {},
): TooltipPosition {
  const candidates = preferredPlacements.map((placement) =>
    buildTooltipPosition(
      rect,
      placement,
      tooltipWidth,
      tooltipHeight,
      viewportWidth,
      viewportHeight,
    ),
  );

  return (
    candidates.find((candidate) => candidate.overflow === 0) ?? candidates[0]
  );
}

function buildTooltipPosition(
  rect: TooltipAnchorRect,
  placement: TooltipPlacement,
  tooltipWidth: number,
  tooltipHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  if (placement === 'left') {
    const x = rect.left - TOOLTIP_OFFSET_PX;
    const y = clamp(
      rect.top,
      TOOLTIP_EDGE_PADDING_PX,
      viewportHeight - tooltipHeight - TOOLTIP_EDGE_PADDING_PX,
    );
    return {
      x,
      y,
      placement,
      overflow: overflowForRect(
        x - tooltipWidth,
        y,
        x,
        y + tooltipHeight,
        viewportWidth,
        viewportHeight,
      ),
    };
  }

  if (placement === 'right') {
    const x = rect.right + TOOLTIP_OFFSET_PX;
    const y = clamp(
      rect.top,
      TOOLTIP_EDGE_PADDING_PX,
      viewportHeight - tooltipHeight - TOOLTIP_EDGE_PADDING_PX,
    );
    return {
      x,
      y,
      placement,
      overflow: overflowForRect(
        x,
        y,
        x + tooltipWidth,
        y + tooltipHeight,
        viewportWidth,
        viewportHeight,
      ),
    };
  }

  const anchorX = rect.left + (rect.width ?? rect.right - rect.left) / 2;
  const x = clamp(
    anchorX,
    TOOLTIP_EDGE_PADDING_PX + tooltipWidth / 2,
    viewportWidth - TOOLTIP_EDGE_PADDING_PX - tooltipWidth / 2,
  );

  if (placement === 'top') {
    const y = rect.top;
    return {
      x,
      y,
      placement,
      overflow: overflowForRect(
        x - tooltipWidth / 2,
        y - tooltipHeight - TOOLTIP_OFFSET_PX,
        x + tooltipWidth / 2,
        y - TOOLTIP_OFFSET_PX,
        viewportWidth,
        viewportHeight,
      ),
    };
  }

  const y = rect.bottom + TOOLTIP_OFFSET_PX;
  return {
    x,
    y,
    placement,
    overflow: overflowForRect(
      x - tooltipWidth / 2,
      y,
      x + tooltipWidth / 2,
      y + tooltipHeight,
      viewportWidth,
      viewportHeight,
    ),
  };
}

function clamp(value: number, min: number, max: number) {
  if (min > max) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function overflowForRect(
  left: number,
  top: number,
  right: number,
  bottom: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const min = TOOLTIP_EDGE_PADDING_PX;
  const maxX = viewportWidth - TOOLTIP_EDGE_PADDING_PX;
  const maxY = viewportHeight - TOOLTIP_EDGE_PADDING_PX;

  return (
    Math.max(0, min - left) +
    Math.max(0, min - top) +
    Math.max(0, right - maxX) +
    Math.max(0, bottom - maxY)
  );
}
