import { useCallback } from 'react';
import { t } from '../../../i18n';
import { getInventoryItemAction } from '../../../app/App/appHelpers';
import { gameActions } from '../../../app/store/gameSlice';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import {
  selectGameWorldTimeMs,
  selectPlayerInventory,
} from '../../../app/store/selectors/gameSelectors';
import { selectItemMenu } from '../../../app/store/selectors/uiSelectors';
import { uiActions } from '../../../app/store/uiSlice';
import { canEquipItem, canUseItem } from '../../../game/state';
import { ItemContextMenu } from './ItemContextMenu';

export function ItemContextMenuConnected() {
  const dispatch = useAppDispatch();
  const itemMenu = useAppSelector(selectItemMenu);
  const inventory = useAppSelector(selectPlayerInventory);
  const worldTimeMs = useAppSelector(selectGameWorldTimeMs);

  const handleClose = useCallback(() => {
    dispatch(uiActions.closeItemMenu());
  }, [dispatch]);

  const handleEquip = useCallback(() => {
    if (!itemMenu) return;

    if (itemMenu.slot) {
      dispatch(
        gameActions.unequipItemAtTime({ slot: itemMenu.slot, worldTimeMs }),
      );
      dispatch(uiActions.closeItemMenu());
      return;
    }

    const action = getInventoryItemAction(
      inventory.find((entry) => entry.id === itemMenu.item.id),
    );
    if (action === 'open-recipes') {
      dispatch(uiActions.setWindowVisibility({ key: 'recipes', shown: true }));
      dispatch(uiActions.closeItemMenu());
      return;
    }
    if (action === 'use') {
      dispatch(
        gameActions.useItemAtTime({ itemId: itemMenu.item.id, worldTimeMs }),
      );
      dispatch(uiActions.closeItemMenu());
      return;
    }

    dispatch(
      gameActions.equipItemAtTime({ itemId: itemMenu.item.id, worldTimeMs }),
    );
    dispatch(uiActions.closeItemMenu());
  }, [dispatch, inventory, itemMenu, worldTimeMs]);

  const handleUse = useCallback(() => {
    if (!itemMenu) return;

    const action = getInventoryItemAction(
      inventory.find((entry) => entry.id === itemMenu.item.id),
    );
    if (action === 'open-recipes') {
      dispatch(uiActions.setWindowVisibility({ key: 'recipes', shown: true }));
      dispatch(uiActions.closeItemMenu());
      return;
    }

    dispatch(
      gameActions.useItemAtTime({ itemId: itemMenu.item.id, worldTimeMs }),
    );
    dispatch(uiActions.closeItemMenu());
  }, [dispatch, inventory, itemMenu, worldTimeMs]);

  const handleDrop = useCallback(() => {
    if (!itemMenu) return;

    if (itemMenu.slot) {
      dispatch(
        gameActions.dropEquippedItemAtTime({
          slot: itemMenu.slot,
          worldTimeMs,
        }),
      );
    } else {
      dispatch(
        gameActions.dropInventoryItemAtTime({
          itemId: itemMenu.item.id,
          worldTimeMs,
        }),
      );
    }
    dispatch(uiActions.closeItemMenu());
  }, [dispatch, itemMenu, worldTimeMs]);

  if (!itemMenu) return null;

  const action = itemMenu.slot
    ? 'unequip'
    : getInventoryItemAction(
        inventory.find((entry) => entry.id === itemMenu.item.id),
      );

  return (
    <ItemContextMenu
      item={itemMenu.item}
      x={itemMenu.x}
      y={itemMenu.y}
      equipLabel={
        action === 'open-recipes'
          ? t('ui.itemMenu.openRecipesAction')
          : action === 'use'
            ? t('ui.itemMenu.useAction')
            : action === 'unequip'
              ? t('ui.itemMenu.unequipAction')
              : t('ui.itemMenu.equipAction')
      }
      canEquip={itemMenu.slot ? true : canEquipItem(itemMenu.item)}
      canUse={canUseItem(itemMenu.item)}
      onEquip={handleEquip}
      onUse={handleUse}
      onDrop={handleDrop}
      onClose={handleClose}
    />
  );
}
