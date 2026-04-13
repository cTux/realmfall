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
  headerActions,
  className,
  visible: visibleProp,
  onClose,
  showCloseButton = true,
}: DraggableWindowProps) {
  const windowRef = useRef<HTMLElement | null>(null);
  const windowIdRef = useRef(`window-${Math.random().toString(36).slice(2)}`);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<WindowPosition | null>(null);
  const visualPositionRef = useRef(position);
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
  }, []);

  const flushPendingMove = useCallback(() => {
    frameRef.current = null;
    const nextPosition = pendingMoveRef.current;
    if (!nextPosition) return;
    pendingMoveRef.current = null;
    onMove(nextPosition);
  }, [onMove]);

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
    if (dragRef.current) return;
    applyVisualPosition(position);
  }, [applyVisualPosition, position]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

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

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const nextPosition = {
        x: Math.max(8, moveEvent.clientX - dragRef.current.dx),
        y: Math.max(8, moveEvent.clientY - dragRef.current.dy),
      };
      applyVisualPosition(nextPosition);
      pendingMoveRef.current = nextPosition;
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(flushPendingMove);
      }
    };

    const onPointerUp = () => {
      dragRef.current = null;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        flushPendingMove();
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
      style={{ left: position.x, top: position.y }}
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
      <div className={styles.windowBody}>{children}</div>
    </section>
  );
}
