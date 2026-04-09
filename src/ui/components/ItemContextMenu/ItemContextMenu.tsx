import { memo, useEffect, useRef } from 'react';
import type { ItemContextMenuProps } from './types';
import styles from './styles.module.css';

export const ItemContextMenu = memo(function ItemContextMenu({
  item,
  x,
  y,
  canEquip,
  canUse,
  onEquip,
  onUse,
  onDrop,
  onClose,
}: ItemContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node)) return;
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={styles.menu}
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {canEquip ? (
        <button className={styles.action} onClick={onEquip}>
          Equip
        </button>
      ) : null}
      {canUse ? (
        <button className={styles.action} onClick={onUse}>
          Use
        </button>
      ) : null}
      <button className={styles.action} onClick={onDrop}>
        Drop {item.quantity > 1 ? `x${item.quantity}` : ''}
      </button>
    </div>
  );
});
