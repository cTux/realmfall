export interface WorldMapDragState {
  pointerId: number | null;
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
  dragging: boolean;
}

export function matchesActivePointer(
  activePointerId: number | null,
  event: Partial<Pick<PointerEvent, 'pointerId'>>,
) {
  return (
    activePointerId === null ||
    typeof event.pointerId !== 'number' ||
    activePointerId === event.pointerId
  );
}
