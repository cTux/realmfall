import { memo, useEffect, useRef } from 'react';
import { t } from '../../i18n';
import { formatSecondaryStatLabel } from '../../i18n/labels';
import { ITEM_MODIFICATION_BALANCE } from '../../game/config';
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
  canProspectItem = false,
  canSellEntry = false,
  reforgeOptions = [],
  enchantCost = null,
  corruptCost = null,
  onEquip,
  onUse,
  onDrop,
  onToggleLock,
  onShowRecipes,
  onProspect,
  onReforge,
  onEnchant,
  onCorrupt,
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
      {canProspectItem ? (
        <button className={styles.action} onClick={onProspect}>
          {t('ui.itemMenu.prospectAction')}
        </button>
      ) : null}
      {reforgeOptions.map((option) => (
        <button
          key={`reforge-${option.statIndex}-${option.key}`}
          className={styles.action}
          onClick={() => onReforge?.(option.statIndex)}
        >
          {t('ui.itemMenu.reforgeAction', {
            stat: formatSecondaryStatLabel(option.key),
            gold: option.cost,
          })}
        </button>
      ))}
      {enchantCost != null ? (
        <button className={styles.action} onClick={onEnchant}>
          {t('ui.itemMenu.enchantAction', {
            gold: enchantCost,
          })}
        </button>
      ) : null}
      {corruptCost != null ? (
        <button className={styles.action} onClick={onCorrupt}>
          {t('ui.itemMenu.corruptAction', {
            gold: corruptCost,
            chance: Math.round(
              ITEM_MODIFICATION_BALANCE.corrupt.breakChance * 100,
            ),
          })}
        </button>
      ) : null}
      {canSellEntry ? (
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
