import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import type { DraggableWindowProps } from './types';
import { useUiAudio } from '../../../app/audio/UiAudioContext';
import type { WindowPosition } from '../../../app/constants';
import styles from './styles.module.scss';
import { Icons } from '../../icons';
import { t } from '../../../i18n';
import type { WindowStackLayer } from './types';

const WINDOW_TRANSITION_MS = 180;
const WINDOW_ACTIVATED_EVENT = 'opencode-window-activated';
const WINDOW_VIEWPORT_PADDING_PX = 8;
const WINDOW_STACK_LAYER_BASES: Record<WindowStackLayer, number> = {
  standard: 20,
  modal: 46,
};
const windowStackOrderByLayer: Record<WindowStackLayer, string[]> = {
  standard: [],
  modal: [],
};
const windowNodesById = new Map<
  string,
  { layer: WindowStackLayer; node: HTMLElement }
>();

export function DraggableWindow({
  title,
  position,
  onMove,
  children,
  titleClassName,
  bodyClassName,
  headerActions,
  className,
  visible: visibleProp,
  externalUnmount = false,
  onClose,
  showCloseButton = true,
  resizeBounds,
  onHoverDetail,
  onLeaveDetail,
  closeButtonTooltip,
  stackLayer = 'standard',
}: DraggableWindowProps) {
  const audio = useUiAudio();
  const windowRef = useRef<HTMLElement | null>(null);
  const windowIdRef = useRef(`window-${Math.random().toString(36).slice(2)}`);
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
  const visualPositionRef = useRef(position);
  const wasOpenRef = useRef(false);
  const [isOpenState, setIsOpenState] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const isVisibilityControlled = visibleProp !== undefined;
  const isOpen = isVisibilityControlled ? visibleProp : isOpenState;
  const [isMounted, setIsMounted] = useState(() => isOpen);
  const [isEntered, setIsEntered] = useState(false);
  const shouldRenderWindow =
    isVisibilityControlled && externalUnmount ? true : isMounted;

  const clearWindowInteractionState = useCallback(() => {
    const node = windowRef.current;
    const activeElement = document.activeElement;

    if (
      node &&
      activeElement instanceof HTMLElement &&
      node.contains(activeElement)
    ) {
      activeElement.blur();
    }

    onLeaveDetail?.();
    setHovered(false);
    setActive(false);
  }, [onLeaveDetail]);

  const applyVisualPosition = useCallback((nextPosition: WindowPosition) => {
    visualPositionRef.current = nextPosition;
    const node = windowRef.current;
    if (!node) return;
    node.style.left = `${nextPosition.x}px`;
    node.style.top = `${nextPosition.y}px`;
    node.style.width =
      nextPosition.width === undefined ? '' : `${nextPosition.width}px`;
    node.style.height =
      nextPosition.height === undefined ? '' : `${nextPosition.height}px`;
  }, []);

  const activateWindow = useCallback(() => {
    bringWindowToFront(windowIdRef.current);
    setActive(true);
    window.dispatchEvent(
      new CustomEvent(WINDOW_ACTIVATED_EVENT, {
        detail: windowIdRef.current,
      }),
    );
  }, []);

  useEffect(() => {
    const onWindowActivated = (event: Event) => {
      const activatedWindowId = (event as CustomEvent<string>).detail;
      if (activatedWindowId !== windowIdRef.current) {
        setActive(false);
      }
    };

    window.addEventListener(WINDOW_ACTIVATED_EVENT, onWindowActivated);
    return () =>
      window.removeEventListener(WINDOW_ACTIVATED_EVENT, onWindowActivated);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (!isVisibilityControlled || !externalUnmount) {
        setIsMounted(true);
      }
      setIsEntered(false);
      const frame = window.requestAnimationFrame(() => setIsEntered(true));
      return () => window.cancelAnimationFrame(frame);
    }

    clearWindowInteractionState();
    setIsEntered(false);
    if (isVisibilityControlled && externalUnmount) {
      return;
    }
    const timeout = window.setTimeout(
      () => setIsMounted(false),
      WINDOW_TRANSITION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [
    clearWindowInteractionState,
    externalUnmount,
    isOpen,
    isVisibilityControlled,
  ]);

  useEffect(() => {
    if (dragRef.current || resizeRef.current) return;
    applyVisualPosition(position);
  }, [applyVisualPosition, position]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const node = windowRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (!isWindowOutsideViewport(rect)) return;

      const resetPosition = getViewportResetWindowPosition(
        visualPositionRef.current,
      );
      applyVisualPosition(resetPosition);
      onMove(resetPosition);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [applyVisualPosition, isOpen, onMove]);

  useEffect(() => {
    if (!isOpen) {
      dragCleanupRef.current?.();
      resizeCleanupRef.current?.();
      wasOpenRef.current = false;
      return;
    }

    const shouldFocus = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (!shouldFocus) return;

    const frame = window.requestAnimationFrame(() => {
      activateWindow();
      windowRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activateWindow, isOpen]);

  useEffect(
    () => () => {
      dragCleanupRef.current?.();
      resizeCleanupRef.current?.();
    },
    [],
  );

  useEffect(() => {
    if (!shouldRenderWindow) {
      return;
    }

    const node = windowRef.current;
    if (!node) {
      return;
    }

    const windowId = windowIdRef.current;
    registerWindow({
      id: windowId,
      layer: stackLayer,
      node,
    });

    return () => {
      unregisterWindow(windowId);
    };
  }, [shouldRenderWindow, stackLayer]);

  const closeWindow = () => {
    clearWindowInteractionState();
    if (visibleProp === undefined) {
      setIsOpenState(false);
    }
    onClose?.();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activateWindow();
    dragCleanupRef.current?.();
    resizeCleanupRef.current?.();
    const currentPosition = visualPositionRef.current;
    dragRef.current = {
      dx: event.clientX - currentPosition.x,
      dy: event.clientY - currentPosition.y,
    };
    dragMovedRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const nextPosition = {
        x: Math.max(
          WINDOW_VIEWPORT_PADDING_PX,
          moveEvent.clientX - dragRef.current.dx,
        ),
        y: Math.max(
          WINDOW_VIEWPORT_PADDING_PX,
          moveEvent.clientY - dragRef.current.dy,
        ),
        width: visualPositionRef.current.width,
        height: visualPositionRef.current.height,
      };
      dragMovedRef.current =
        dragMovedRef.current ||
        nextPosition.x !== visualPositionRef.current.x ||
        nextPosition.y !== visualPositionRef.current.y;
      applyVisualPosition(nextPosition);
    };

    const onPointerUp = () => {
      const nextPosition = visualPositionRef.current;
      const didMove = dragMovedRef.current;
      dragCleanupRef.current?.();
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
  };

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeBounds) return;
    event.stopPropagation();
    activateWindow();
    dragCleanupRef.current?.();
    resizeCleanupRef.current?.();
    const node = windowRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };
    resizeMovedRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!resizeRef.current) return;
      const nextPosition = {
        x: visualPositionRef.current.x,
        y: visualPositionRef.current.y,
        width: Math.max(
          resizeBounds.minWidth,
          resizeRef.current.startWidth +
            (moveEvent.clientX - resizeRef.current.startX),
        ),
        height: Math.max(
          resizeBounds.minHeight,
          resizeRef.current.startHeight +
            (moveEvent.clientY - resizeRef.current.startY),
        ),
      };
      resizeMovedRef.current =
        resizeMovedRef.current ||
        nextPosition.width !== visualPositionRef.current.width ||
        nextPosition.height !== visualPositionRef.current.height;
      applyVisualPosition(nextPosition);
    };

    const onPointerUp = () => {
      const nextPosition = visualPositionRef.current;
      const didResize = resizeMovedRef.current;
      resizeCleanupRef.current?.();
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
  };

  const onBlurCapture = (event: ReactFocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setActive(false);
  };

  const emphasis = active ? 'active' : hovered ? 'hovered' : 'idle';

  if (!shouldRenderWindow) return null;

  return (
    <section
      ref={windowRef}
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={isEntered}
      tabIndex={-1}
      style={{
        left: position.x,
        top: position.y,
        width: position.width === undefined ? undefined : `${position.width}px`,
        height:
          position.height === undefined ? undefined : `${position.height}px`,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={activateWindow}
      onFocusCapture={activateWindow}
      onBlurCapture={onBlurCapture}
    >
      <div className={styles.windowHeader} onPointerDown={onPointerDown}>
        <h2 className={`${styles.windowTitle} ${titleClassName ?? ''}`.trim()}>
          {title}
        </h2>
        <div className={styles.windowHeaderActions}>
          {headerActions ? (
            <div
              className={styles.headerActions}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {headerActions}
            </div>
          ) : null}
          {showCloseButton ? (
            <button
              type="button"
              className={styles.headerButton}
              data-ui-audio-click="off"
              aria-label={t('ui.common.close')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.currentTarget.blur();
                audio.swoosh();
                closeWindow();
              }}
              onMouseEnter={(event) =>
                onHoverDetail?.(
                  event,
                  t('ui.common.close'),
                  [
                    {
                      kind: 'text',
                      text: closeButtonTooltip ?? t('ui.tooltip.window.close'),
                    },
                  ],
                  'rgba(248, 113, 113, 0.9)',
                )
              }
              onMouseLeave={onLeaveDetail}
            >
              <span
                className={styles.headerButtonIcon}
                style={{
                  WebkitMaskImage: `url("${Icons.ArrowDunk}")`,
                  maskImage: `url("${Icons.ArrowDunk}")`,
                }}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      </div>
      <div className={`${styles.windowBody} ${bodyClassName ?? ''}`.trim()}>
        {children}
      </div>
      {resizeBounds ? (
        <div
          className={styles.resizeHandle}
          onPointerDown={onResizePointerDown}
          aria-hidden="true"
        />
      ) : null}
    </section>
  );
}

function registerWindow({
  id,
  layer,
  node,
}: {
  id: string;
  layer: WindowStackLayer;
  node: HTMLElement;
}) {
  const existing = windowNodesById.get(id);
  if (existing && existing.layer !== layer) {
    removeWindowFromLayer(existing.layer, id);
  }

  windowNodesById.set(id, { layer, node });
  const layerOrder = windowStackOrderByLayer[layer];
  if (!layerOrder.includes(id)) {
    layerOrder.push(id);
  }
  syncWindowStackLayer(layer);
}

function unregisterWindow(id: string) {
  const existing = windowNodesById.get(id);
  if (!existing) {
    return;
  }

  windowNodesById.delete(id);
  removeWindowFromLayer(existing.layer, id);
  syncWindowStackLayer(existing.layer);
}

function bringWindowToFront(id: string) {
  const existing = windowNodesById.get(id);
  if (!existing) {
    return;
  }

  const { layer } = existing;
  const layerOrder = windowStackOrderByLayer[layer];
  const currentIndex = layerOrder.indexOf(id);
  if (currentIndex !== -1) {
    layerOrder.splice(currentIndex, 1);
  }
  layerOrder.push(id);
  syncWindowStackLayer(layer);
}

function removeWindowFromLayer(layer: WindowStackLayer, id: string) {
  const layerOrder = windowStackOrderByLayer[layer];
  const currentIndex = layerOrder.indexOf(id);
  if (currentIndex !== -1) {
    layerOrder.splice(currentIndex, 1);
  }
}

function syncWindowStackLayer(layer: WindowStackLayer) {
  const baseZIndex = WINDOW_STACK_LAYER_BASES[layer];
  windowStackOrderByLayer[layer].forEach((id, index) => {
    const entry = windowNodesById.get(id);
    if (!entry || entry.layer !== layer) {
      return;
    }

    entry.node.style.zIndex = String(baseZIndex + index);
  });
}

function isWindowOutsideViewport(rect: DOMRect) {
  return (
    rect.left < 0 ||
    rect.top < 0 ||
    rect.right > window.innerWidth ||
    rect.bottom > window.innerHeight
  );
}

function getViewportResetWindowPosition(
  position: WindowPosition,
): WindowPosition {
  return {
    ...position,
    x: WINDOW_VIEWPORT_PADDING_PX,
    y: WINDOW_VIEWPORT_PADDING_PX,
  };
}
