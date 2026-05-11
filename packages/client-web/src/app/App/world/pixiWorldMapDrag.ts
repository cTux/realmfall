import type { MutableRefObject } from 'react';
import type { WorldMapCameraState } from '../../../ui/world/worldMapCamera';
import type { QueueWorldMapCameraUpdate } from './pixiWorldCameraUpdateScheduler';
import {
  matchesActivePointer,
  type WorldMapDragState,
} from './pixiWorldInteractionShared';

export function beginWorldMapDrag({
  canvas,
  dragStateRef,
  event,
  worldMapCameraRef,
}: {
  canvas: HTMLCanvasElement;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  event: Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
}) {
  const pointerId =
    typeof event.pointerId === 'number' ? event.pointerId : null;

  dragStateRef.current = {
    pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPanX: worldMapCameraRef.current.panX,
    startPanY: worldMapCameraRef.current.panY,
    dragging: false,
  };
  if (pointerId !== null) {
    canvas.setPointerCapture?.(pointerId);
  }
}

export function handleWorldMapDragMove({
  canvas,
  clearHoverState,
  dragStateRef,
  event,
  queueCameraUpdate,
  scheduleCameraSave,
  worldMapCameraRef,
}: {
  canvas: HTMLCanvasElement;
  clearHoverState: () => void;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  event: Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>;
  queueCameraUpdate: QueueWorldMapCameraUpdate;
  scheduleCameraSave: () => void;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
}) {
  const dragState = dragStateRef.current;
  if (!dragState || !matchesActivePointer(dragState.pointerId, event)) {
    return false;
  }

  const deltaX = event.clientX - dragState.startClientX;
  const deltaY = event.clientY - dragState.startClientY;
  if (dragState.dragging || Math.hypot(deltaX, deltaY) >= 4) {
    if (!dragState.dragging) {
      dragState.dragging = true;
      clearHoverState();
    }
    const nextCamera = {
      ...worldMapCameraRef.current,
      panX: dragState.startPanX + deltaX,
      panY: dragState.startPanY + deltaY,
    };
    worldMapCameraRef.current = nextCamera;
    queueCameraUpdate(nextCamera);
    canvas.style.cursor = 'grabbing';
    scheduleCameraSave();
  }

  return true;
}

export function finishWorldMapDrag({
  canvas,
  dragStateRef,
  event,
}: {
  canvas: HTMLCanvasElement;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  event: Pick<PointerEvent, 'pointerId'>;
}) {
  const dragState = dragStateRef.current;
  if (!dragState || !matchesActivePointer(dragState.pointerId, event)) {
    return null;
  }

  if (dragState.pointerId !== null) {
    canvas.releasePointerCapture?.(dragState.pointerId);
  }
  dragStateRef.current = null;

  return dragState;
}

export function cancelWorldMapDrag({
  canvas,
  dragStateRef,
  event,
}: {
  canvas: HTMLCanvasElement;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  event: Pick<PointerEvent, 'pointerId'>;
}) {
  const dragState = dragStateRef.current;
  if (!dragState || !matchesActivePointer(dragState.pointerId, event)) {
    return;
  }
  if (dragState.pointerId !== null) {
    canvas.releasePointerCapture?.(dragState.pointerId);
  }
  dragStateRef.current = null;
  canvas.style.cursor = 'default';
}
