import { getItemCategory } from './content/items';
import type { ItemView } from './stateTypes';

export const ACTION_BAR_SLOT_COUNT = 9;

export interface ActionBarSlotBinding<TItem extends ItemView = ItemView> {
  item: TItem;
}

export type ActionBarSlots<TItem extends ItemView = ItemView> =
  Array<ActionBarSlotBinding<TItem> | null>;

export function createDefaultActionBarSlots<
  TItem extends ItemView = ItemView,
>(): ActionBarSlots<TItem> {
  return Array.from({ length: ACTION_BAR_SLOT_COUNT }, () => null);
}

export function getConsumablesFromInventory<TItem extends ItemView>(
  inventory: TItem[],
) {
  return inventory.filter((item) => getItemCategory(item) === 'consumable');
}

export function findActionBarItem<TItem extends ItemView>(
  inventory: TItem[],
  slot: ActionBarSlotBinding<TItem> | null,
) {
  if (!slot) return undefined;

  return inventory.find((item) => matchesActionBarItem(item, slot.item));
}

export function matchesActionBarItem(
  item: Pick<ItemView, 'itemKey' | 'name'>,
  target: Pick<ItemView, 'itemKey' | 'name'>,
) {
  if (target.itemKey && item.itemKey) {
    return item.itemKey === target.itemKey;
  }

  return item.name === target.name;
}

export function reconcileActionBarSlots<TItem extends ItemView>(
  inventory: TItem[],
  slots: ActionBarSlots<TItem>,
): ActionBarSlots<TItem> {
  let changed = false;

  const next = slots.map((slot) => {
    if (!slot || findActionBarItem(inventory, slot)) {
      return slot;
    }

    changed = true;
    return null;
  });

  return changed ? next : slots;
}
