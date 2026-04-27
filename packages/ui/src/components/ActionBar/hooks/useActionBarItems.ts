import { useMemo } from 'react';
import type { Item } from '../../../../game/stateTypes';
import {
  ACTION_BAR_SLOT_COUNT,
  findActionBarItem,
  getConsumablesFromInventory,
  type ActionBarSlots,
} from '../../../../app/App/actionBar';

export interface ActionBarSlotItem {
  slotIndex: number;
  displayItem?: Item;
  depleted: boolean;
}

export interface ActionBarItems {
  consumables: Item[];
  slotItems: ActionBarSlotItem[];
}

export function useActionBarItems(
  inventory: Item[],
  slots: ActionBarSlots,
): ActionBarItems {
  const consumables = useMemo(
    () => getConsumablesFromInventory(inventory),
    [inventory],
  );
  const slotItems = useMemo(
    () =>
      Array.from({ length: ACTION_BAR_SLOT_COUNT }, (_, slotIndex) => {
        const assigned = slots[slotIndex];
        const linkedItem = findActionBarItem(inventory, assigned);
        const displayItem = linkedItem ?? assigned?.item;
        const depleted = Boolean(assigned && !linkedItem);

        return {
          slotIndex,
          displayItem,
          depleted,
        };
      }),
    [inventory, slots],
  );

  return useMemo(
    () => ({
      consumables,
      slotItems,
    }),
    [consumables, slotItems],
  );
}
