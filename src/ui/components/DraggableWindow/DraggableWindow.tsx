import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { DraggableWindowProps } from './types';
import styles from './styles.module.css';

export function DraggableWindow({
  title,
  position,
  onMove,
  children,
  className,
}: DraggableWindowProps) {
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

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
        <span className={styles.muted}>drag</span>
      </div>
      <div className={styles.windowBody}>{children}</div>
    </section>
  );
}
