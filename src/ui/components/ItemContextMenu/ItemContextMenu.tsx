import { memo, useEffect, useRef } from 'react';
import { t } from '../../../i18n';
import type { ItemContextMenuProps } from './types';
import styles from './styles.module.scss';

export const ItemContextMenu = memo(function ItemContextMenu({
  item,
  x,
  y,
  equipLabel,
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
          {equipLabel ?? t('ui.itemMenu.equipAction')}
        </button>
      ) : null}
      {canUse ? (
        <button className={styles.action} onClick={onUse}>
          {t('ui.itemMenu.useAction')}
        </button>
      ) : null}
      <button className={styles.action} onClick={onDrop}>
        {t('ui.itemMenu.dropAction', {
          quantity: item.quantity > 1 ? `x${item.quantity}` : '',
        }).trim()}
      </button>
    </div>
  );
});
