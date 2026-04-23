import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
} from 'react';
import { canSellItem, isEquippableItem } from '../../../game/inventory';
import { getCurrentTile } from '../../../game/stateSelectors';
import type { GameState } from '../../../game/stateTypes';
import {
  canModifyItem,
  getItemModificationCost,
  getReforgeableItemSecondaryStats,
} from '../../../game/itemModifications';
import type { ItemContextMenuState, TooltipItem } from '../types';

export function useItemContextMenuController({
  gameRef,
}: {
  gameRef: MutableRefObject<GameState>;
}) {
  const [itemMenu, setItemMenu] = useState<ItemContextMenuState | null>(null);

  const closeItemMenu = useCallback(() => {
    setItemMenu(null);
  }, []);

  const handleContextItem = useCallback(
    (event: ReactMouseEvent<HTMLElement>, item: TooltipItem) => {
      event.preventDefault();
      const currentStructure = getCurrentTile(gameRef.current).structure;
      const reforgeOptions =
        currentStructure === 'rune-forge' &&
        isEquippableItem(item) &&
        canModifyItem(item)
          ? getReforgeableItemSecondaryStats(item).map((entry) => ({
              cost: getItemModificationCost(item, 'reforge'),
              key: entry.stat.key,
              statIndex: entry.index,
            }))
          : [];
      const enchantCost =
        currentStructure === 'mana-font' &&
        isEquippableItem(item) &&
        canModifyItem(item)
          ? getItemModificationCost(item, 'enchant')
          : null;
      const corruptCost =
        currentStructure === 'corruption-altar' &&
        isEquippableItem(item) &&
        canModifyItem(item)
          ? getItemModificationCost(item, 'corrupt')
          : null;
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        canProspectItem:
          currentStructure === 'forge' &&
          isEquippableItem(item) &&
          !item.locked,
        canSellEntry:
          currentStructure === 'town' && canSellItem(item) && !item.locked,
        reforgeOptions,
        enchantCost,
        corruptCost,
      });
    },
    [gameRef],
  );

  const handleEquippedContextItem = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      item: TooltipItem,
      slot: ItemContextMenuState['slot'],
    ) => {
      event.preventDefault();
      setItemMenu({
        item,
        x: event.clientX,
        y: event.clientY,
        slot,
        canProspectItem: false,
        canSellEntry: false,
        reforgeOptions: [],
        enchantCost: null,
        corruptCost: null,
      });
    },
    [],
  );

  return {
    closeItemMenu,
    handleContextItem,
    handleEquippedContextItem,
    itemMenu,
  };
}
