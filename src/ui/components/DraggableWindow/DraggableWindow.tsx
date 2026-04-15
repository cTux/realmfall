import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import type { DraggableWindowProps } from './types';
import type { WindowPosition } from '../../../app/constants';
import styles from './styles.module.scss';
import { Icons } from '../../icons';
import { t } from '../../../i18n';

const WINDOW_TRANSITION_MS = 180;
const WINDOW_ACTIVATED_EVENT = 'opencode-window-activated';

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
  onClose,
  showCloseButton = true,
  resizeBounds,
  onHoverDetail,
  onLeaveDetail,
  closeButtonTooltip,
}: DraggableWindowProps) {
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
  const visualPositionRef = useRef(position);
  const wasVisibleRef = useRef(false);
  const [visibleState, setVisibleState] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const visible = visibleProp === undefined ? visibleState : visibleProp;
  const [renderWindow, setRenderWindow] = useState(() => visible);
  const [animatedVisible, setAnimatedVisible] = useState(false);

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

  const activateWindow = () => {
    setActive(true);
    window.dispatchEvent(
      new CustomEvent(WINDOW_ACTIVATED_EVENT, {
        detail: windowIdRef.current,
      }),
    );
  };

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
    if (visible) {
      setRenderWindow(true);
      setAnimatedVisible(false);
      const frame = window.requestAnimationFrame(() =>
        setAnimatedVisible(true),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    setAnimatedVisible(false);
    const timeout = window.setTimeout(
      () => setRenderWindow(false),
      WINDOW_TRANSITION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [visible]);

  useEffect(() => {
    if (dragRef.current || resizeRef.current) return;
    applyVisualPosition(position);
  }, [applyVisualPosition, position]);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      return;
    }

    const shouldFocus = !wasVisibleRef.current;
    wasVisibleRef.current = true;
    if (!shouldFocus) return;

    const frame = window.requestAnimationFrame(() => {
      activateWindow();
      windowRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  const closeWindow = () => {
    if (visibleProp === undefined) {
      setVisibleState(false);
    }
    onClose?.();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activateWindow();
    const currentPosition = visualPositionRef.current;
    dragRef.current = {
      dx: event.clientX - currentPosition.x,
      dy: event.clientY - currentPosition.y,
    };
    dragMovedRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const nextPosition = {
        x: Math.max(8, moveEvent.clientX - dragRef.current.dx),
        y: Math.max(8, moveEvent.clientY - dragRef.current.dy),
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
      dragRef.current = null;
      const didMove = dragMovedRef.current;
      dragMovedRef.current = false;
      if (didMove) {
        onMove(nextPosition);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeBounds) return;
    event.stopPropagation();
    activateWindow();
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
      resizeRef.current = null;
      const didResize = resizeMovedRef.current;
      resizeMovedRef.current = false;
      if (didResize) {
        onMove(nextPosition);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
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

  if (!renderWindow) return null;

  return (
    <section
      ref={windowRef}
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={animatedVisible}
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
              aria-label={t('ui.common.close')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeWindow}
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
