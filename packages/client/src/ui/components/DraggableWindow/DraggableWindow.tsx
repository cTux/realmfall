import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import type { WindowPosition } from '../../../app/constants';
import { DraggableWindowFrame } from './DraggableWindowFrame';
import type { DraggableWindowProps } from './types';
import { useDraggableWindowInteractions } from './useDraggableWindowInteractions';
import {
  bringWindowToFront,
  registerWindow,
  unregisterWindow,
  WINDOW_ACTIVATED_EVENT,
} from './windowStack';
import {
  getViewportResetWindowPosition,
  isWindowOutsideViewport,
} from './windowViewport';

const WINDOW_TRANSITION_MS = 180;

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
  const windowRef = useRef<HTMLElement | null>(null);
  const windowIdRef = useRef(`window-${Math.random().toString(36).slice(2)}`);
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
    if (!node) {
      return;
    }

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

  const {
    cancelInteractions,
    hasActiveInteraction,
    onDragPointerDown,
    onResizePointerDown,
  } = useDraggableWindowInteractions({
    activateWindow,
    applyVisualPosition,
    onMove,
    resizeBounds,
    visualPositionRef,
    windowRef,
  });

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
    if (hasActiveInteraction()) {
      return;
    }
    applyVisualPosition(position);
  }, [applyVisualPosition, hasActiveInteraction, position]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const node = windowRef.current;
      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      if (!isWindowOutsideViewport(rect)) {
        return;
      }

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
      cancelInteractions();
      wasOpenRef.current = false;
      return;
    }

    const shouldFocus = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (!shouldFocus) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      activateWindow();
      windowRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activateWindow, cancelInteractions, isOpen]);

  useEffect(
    () => () => {
      cancelInteractions();
    },
    [cancelInteractions],
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

  const onBlurCapture = (event: ReactFocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setActive(false);
  };

  const emphasis = active ? 'active' : hovered ? 'hovered' : 'idle';

  if (!shouldRenderWindow) {
    return null;
  }

  return (
    <DraggableWindowFrame
      bodyClassName={bodyClassName}
      className={className}
      closeButtonTooltip={closeButtonTooltip}
      emphasis={emphasis}
      headerActions={headerActions}
      isEntered={isEntered}
      onBlurCapture={onBlurCapture}
      onClose={closeWindow}
      onHeaderPointerDown={onDragPointerDown}
      onHoverDetail={onHoverDetail}
      onLeaveDetail={onLeaveDetail}
      onResizePointerDown={onResizePointerDown}
      onWindowActivate={activateWindow}
      onWindowHoverEnter={() => setHovered(true)}
      onWindowHoverLeave={() => setHovered(false)}
      position={position}
      resizeBounds={resizeBounds}
      showCloseButton={showCloseButton}
      title={title}
      titleClassName={titleClassName}
      windowRef={windowRef}
    >
      {children}
    </DraggableWindowFrame>
  );
}
