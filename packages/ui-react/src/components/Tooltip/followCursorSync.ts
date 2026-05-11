let followCursorTooltipElement: HTMLDivElement | null = null;

export function setFollowCursorTooltipElement(element: HTMLDivElement | null) {
  followCursorTooltipElement = element;
}

export function syncFollowCursorTooltipPosition(
  position: {
    x: number;
    y: number;
  } | null,
) {
  if (!followCursorTooltipElement || !position) {
    return;
  }

  followCursorTooltipElement.style.left = `${position.x}px`;
  followCursorTooltipElement.style.top = `${position.y}px`;
}
