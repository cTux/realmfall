import {
  useState,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { DraggableWindowProps } from './types';
import styles from './styles.module.css';

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
  const collapsed = collapsedProp ?? collapsedState;

  const toggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    if (collapsedProp === undefined) {
      setCollapsedState(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  return (
    <section
      className={`${styles.floatingWindow} ${className ?? ''}`.trim()}
      style={{ left: position.x, top: position.y }}
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
