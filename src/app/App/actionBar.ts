import { getItemCategory } from '../../game/content/items';
import type { Item } from '../../game/stateTypes';

export const ACTION_BAR_SLOT_COUNT = 9;

export interface ActionBarSlotBinding {
  item: Item;
}

export type ActionBarSlots = Array<ActionBarSlotBinding | null>;

export function createDefaultActionBarSlots(): ActionBarSlots {
  return Array.from({ length: ACTION_BAR_SLOT_COUNT }, () => null);
}

export function normalizeActionBarSlots(
  slots: unknown,
  normalizeItem: (item: Item) => Item | null,
): ActionBarSlots {
  if (!Array.isArray(slots)) {
    return createDefaultActionBarSlots();
  }

  return Array.from({ length: ACTION_BAR_SLOT_COUNT }, (_, index) => {
    const slot = slots[index];
    if (!slot || typeof slot !== 'object' || !('item' in slot)) {
      return null;
    }

    const { item } = slot as { item?: Item };
    if (!item || typeof item !== 'object') {
      return null;
    }

    const normalizedItem = normalizeItem(item);
    if (!normalizedItem) {
      return null;
    }

    return {
      item: normalizedItem,
    };
  });
}

export function getConsumablesFromInventory(inventory: Item[]) {
  return inventory.filter((item) => getItemCategory(item) === 'consumable');
}

export function findActionBarItem(
  inventory: Item[],
  slot: ActionBarSlotBinding | null,
): Item | undefined {
  if (!slot) return undefined;

  return inventory.find((item) => matchesActionBarItem(item, slot.item));
}

export function matchesActionBarItem(item: Item, target: Item) {
  if (target.itemKey && item.itemKey) {
    return item.itemKey === target.itemKey;
  }

  return item.name === target.name;
}

export function reconcileActionBarSlots(
  inventory: Item[],
  slots: ActionBarSlots,
): ActionBarSlots {
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
