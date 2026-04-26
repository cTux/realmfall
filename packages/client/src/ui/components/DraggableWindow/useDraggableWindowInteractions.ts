import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { WindowPosition } from '../../../app/constants';
import type { WindowResizeBounds } from './types';
import { WINDOW_VIEWPORT_PADDING_PX } from './windowViewport';

interface UseDraggableWindowInteractionsArgs {
  activateWindow: () => void;
  applyVisualPosition: (nextPosition: WindowPosition) => void;
  onMove: (position: WindowPosition) => void;
  resizeBounds?: WindowResizeBounds;
  visualPositionRef: RefObject<WindowPosition>;
  windowRef: RefObject<HTMLElement | null>;
}

export function useDraggableWindowInteractions({
  activateWindow,
  applyVisualPosition,
  onMove,
  resizeBounds,
  visualPositionRef,
  windowRef,
}: UseDraggableWindowInteractionsArgs) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const dragMovedRef = useRef(false);
  const resizeMovedRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  const cleanupDrag = useCallback(() => {
    dragCleanupRef.current?.();
  }, []);

  const cleanupResize = useCallback(() => {
    resizeCleanupRef.current?.();
  }, []);

  const cancelInteractions = useCallback(() => {
    cleanupDrag();
    cleanupResize();
  }, [cleanupDrag, cleanupResize]);

  const hasActiveInteraction = useCallback(
    () => dragRef.current !== null || resizeRef.current !== null,
    [],
  );

  const onDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      activateWindow();
      cancelInteractions();

      const currentPosition = visualPositionRef.current;
      dragRef.current = {
        dx: event.clientX - currentPosition.x,
        dy: event.clientY - currentPosition.y,
      };
      dragMovedRef.current = false;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        const position = visualPositionRef.current;
        if (!drag) {
          return;
        }

        const nextPosition = {
          x: Math.max(WINDOW_VIEWPORT_PADDING_PX, moveEvent.clientX - drag.dx),
          y: Math.max(WINDOW_VIEWPORT_PADDING_PX, moveEvent.clientY - drag.dy),
          width: position.width,
          height: position.height,
        };

        dragMovedRef.current =
          dragMovedRef.current ||
          nextPosition.x !== position.x ||
          nextPosition.y !== position.y;
        applyVisualPosition(nextPosition);
      };

      const onPointerUp = () => {
        const nextPosition = visualPositionRef.current;
        const didMove = dragMovedRef.current;
        cleanupDrag();
        if (didMove) {
          onMove(nextPosition);
        }
      };

      dragCleanupRef.current = () => {
        dragRef.current = null;
        dragMovedRef.current = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        dragCleanupRef.current = null;
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [
      activateWindow,
      applyVisualPosition,
      cancelInteractions,
      cleanupDrag,
      onMove,
      visualPositionRef,
    ],
  );

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!resizeBounds) {
        return;
      }

      event.stopPropagation();
      activateWindow();
      cancelInteractions();

      const node = windowRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      resizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
      };
      resizeMovedRef.current = false;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const resize = resizeRef.current;
        const position = visualPositionRef.current;
        if (!resize) {
          return;
        }

        const nextPosition = {
          x: position.x,
          y: position.y,
          width: Math.max(
            resizeBounds.minWidth,
            resize.startWidth + (moveEvent.clientX - resize.startX),
          ),
          height: Math.max(
            resizeBounds.minHeight,
            resize.startHeight + (moveEvent.clientY - resize.startY),
          ),
        };

        resizeMovedRef.current =
          resizeMovedRef.current ||
          nextPosition.width !== position.width ||
          nextPosition.height !== position.height;
        applyVisualPosition(nextPosition);
      };

      const onPointerUp = () => {
        const nextPosition = visualPositionRef.current;
        const didResize = resizeMovedRef.current;
        cleanupResize();
        if (didResize) {
          onMove(nextPosition);
        }
      };

      resizeCleanupRef.current = () => {
        resizeRef.current = null;
        resizeMovedRef.current = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        resizeCleanupRef.current = null;
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [
      activateWindow,
      applyVisualPosition,
      cancelInteractions,
      cleanupResize,
      onMove,
      resizeBounds,
      visualPositionRef,
      windowRef,
    ],
  );

  return {
    cancelInteractions,
    hasActiveInteraction,
    onDragPointerDown,
    onResizePointerDown,
  };
}
