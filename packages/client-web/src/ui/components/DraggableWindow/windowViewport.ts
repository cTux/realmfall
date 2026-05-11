import type { WindowPosition } from '../../../app/constants';

export const WINDOW_VIEWPORT_PADDING_PX = 8;

export function isWindowOutsideViewport(rect: DOMRect) {
  return (
    rect.left < 0 ||
    rect.top < 0 ||
    rect.right > window.innerWidth ||
    rect.bottom > window.innerHeight
  );
}

export function getViewportResetWindowPosition(
  position: WindowPosition,
): WindowPosition {
  return {
    ...position,
    x: WINDOW_VIEWPORT_PADDING_PX,
    y: WINDOW_VIEWPORT_PADDING_PX,
  };
}
