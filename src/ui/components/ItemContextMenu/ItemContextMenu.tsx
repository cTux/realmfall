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
  canToggleLock = false,
  isLocked = false,
  canShowRecipes = false,
  canProspect = false,
  canSell = false,
  onEquip,
  onUse,
  onDrop,
  onToggleLock,
  onShowRecipes,
  onProspect,
  onSell,
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
      {canToggleLock ? (
        <button className={styles.action} onClick={onToggleLock}>
          {isLocked
            ? t('ui.itemMenu.unlockAction')
            : t('ui.itemMenu.lockAction')}
        </button>
      ) : null}
      {canShowRecipes ? (
        <button className={styles.action} onClick={onShowRecipes}>
          {t('ui.itemMenu.showRecipesAction')}
        </button>
      ) : null}
      {canProspect ? (
        <button className={styles.action} onClick={onProspect}>
          {t('ui.itemMenu.prospectAction')}
        </button>
      ) : null}
      {canSell ? (
        <button className={styles.action} onClick={onSell}>
          {t('ui.itemMenu.sellAction')}
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
