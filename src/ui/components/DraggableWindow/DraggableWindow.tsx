import {
  useEffect,
  useState,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import type { DraggableWindowProps } from './types';
import styles from './styles.module.css';

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
  collapsed: collapsedProp,
  onCollapsedChange,
  visible = true,
}: DraggableWindowProps) {
  const windowIdRef = useRef(`window-${Math.random().toString(36).slice(2)}`);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [collapsedState, setCollapsedState] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const collapsed = collapsedProp ?? collapsedState;
  const [bodyVisible, setBodyVisible] = useState(() => !collapsed);
  const [bodyExpanded, setBodyExpanded] = useState(() => !collapsed);

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
    if (!collapsed) {
      setBodyVisible(true);
      const frame = window.requestAnimationFrame(() => setBodyExpanded(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setBodyExpanded(false);
    const timeout = window.setTimeout(
      () => setBodyVisible(false),
      WINDOW_TRANSITION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [collapsed]);

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    if (collapsedProp === undefined) {
      setCollapsedState(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    activateWindow();
    dragRef.current = {
      dx: event.clientX - position.x,
      dy: event.clientY - position.y,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      onMove({
        x: Math.max(8, moveEvent.clientX - dragRef.current.dx),
        y: Math.max(8, moveEvent.clientY - dragRef.current.dy),
      });
    };

    const onPointerUp = () => {
      dragRef.current = null;
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

  return (
    <section
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      data-window-emphasis={emphasis}
      data-window-visible={visible}
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
          <button
            type="button"
            className={styles.headerButton}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </div>
      {bodyVisible ? (
        <div
          className={styles.windowBodyFrame}
          data-window-body-state={bodyExpanded ? 'open' : 'closed'}
          aria-hidden={!bodyExpanded}
        >
          <div className={styles.windowBody}>{children}</div>
        </div>
      ) : null}
    </section>
  );
}
