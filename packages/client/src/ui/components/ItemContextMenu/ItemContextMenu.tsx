import { memo, useEffect, useRef } from 'react';
import { Button } from '@realmfall/ui';
import { t } from '../../../i18n';
import { formatSecondaryStatLabel } from '../../../i18n/labels';
import { ITEM_MODIFICATION_BALANCE } from '../../../game/config';
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
        <Button className={styles.action} onClick={onEquip}>
          {equipLabel ?? t('ui.itemMenu.equipAction')}
        </Button>
      ) : null}
      {canUse ? (
        <Button className={styles.action} onClick={onUse}>
          {t('ui.itemMenu.useAction')}
        </Button>
      ) : null}
      {canToggleLock ? (
        <Button className={styles.action} onClick={onToggleLock}>
          {isLocked
            ? t('ui.itemMenu.unlockAction')
            : t('ui.itemMenu.lockAction')}
        </Button>
      ) : null}
      {canShowRecipes ? (
        <Button className={styles.action} onClick={onShowRecipes}>
          {t('ui.itemMenu.showRecipesAction')}
        </Button>
      ) : null}
      {canProspectItem ? (
        <Button className={styles.action} onClick={onProspect}>
          {t('ui.itemMenu.prospectAction')}
        </Button>
      ) : null}
      {reforgeOptions.map((option) => (
        <Button
          key={`reforge-${option.statIndex}-${option.key}`}
          className={styles.action}
          onClick={() => onReforge?.(option.statIndex)}
        >
          {t('ui.itemMenu.reforgeAction', {
            stat: formatSecondaryStatLabel(option.key),
            gold: option.cost,
          })}
        </Button>
      ))}
      {enchantCost != null ? (
        <Button className={styles.action} onClick={onEnchant}>
          {t('ui.itemMenu.enchantAction', {
            gold: enchantCost,
          })}
        </Button>
      ) : null}
      {corruptCost != null ? (
        <Button className={styles.action} onClick={onCorrupt}>
          {t('ui.itemMenu.corruptAction', {
            gold: corruptCost,
            chance: Math.round(
              ITEM_MODIFICATION_BALANCE.corrupt.breakChance * 100,
            ),
          })}
        </Button>
      ) : null}
      {canSellEntry ? (
        <Button className={styles.action} onClick={onSell}>
          {t('ui.itemMenu.sellAction')}
        </Button>
      ) : null}
      <Button className={styles.action} onClick={onDrop}>
        {t('ui.itemMenu.dropAction', {
          quantity: item.quantity > 1 ? `x${item.quantity}` : '',
        }).trim()}
      </Button>
    </div>
  );
});
