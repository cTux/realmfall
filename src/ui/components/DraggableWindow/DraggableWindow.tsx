import {
  useEffect,
  useState,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import type { DraggableWindowProps } from './types';
import styles from './styles.module.css';

const WINDOW_BASE_Z_INDEX = 20;

let nextWindowZIndex = WINDOW_BASE_Z_INDEX;

const claimWindowZIndex = () => {
  nextWindowZIndex += 1;
  return nextWindowZIndex;
};

export function DraggableWindow({
  title,
  position,
  onMove,
  children,
  className,
  collapsed: collapsedProp,
  onCollapsedChange,
}: DraggableWindowProps) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [collapsedState, setCollapsedState] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [zIndex, setZIndex] = useState(() => claimWindowZIndex());
  const collapsed = collapsedProp ?? collapsedState;

  const elevateWindow = () => {
    setZIndex(claimWindowZIndex());
  };

  useEffect(() => {
    if (!active && !hovered) return;
    elevateWindow();
  }, [active, hovered]);

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    if (collapsedProp === undefined) {
      setCollapsedState(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    setActive(true);
    elevateWindow();
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
      style={{ left: position.x, top: position.y, zIndex }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={() => {
        setActive(true);
        elevateWindow();
      }}
      onFocusCapture={() => {
        setActive(true);
        elevateWindow();
      }}
      onBlurCapture={onBlurCapture}
    >
      <div className={styles.windowHeader} onPointerDown={onPointerDown}>
        <h2 className={styles.windowTitle}>{title}</h2>
        <button
          type="button"
          className={styles.collapseToggle}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
        >
          {collapsed ? 'expand' : 'collapse'}
        </button>
      </div>
      {collapsed ? null : <div className={styles.windowBody}>{children}</div>}
    </section>
  );
}
