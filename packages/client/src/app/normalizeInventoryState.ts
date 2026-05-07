import { consolidateInventory } from '../game/inventory';
import { cloneItems } from '../game/stateClone';
import type { Item } from '../game/stateTypes';
import { normalizeItem } from './normalizeItems';
import { isRecord } from './normalizeShared';

export function normalizeItemArray(value: unknown, fallback: Item[]) {
  if (!isRecord(value) || !Array.isArray(value)) {
    return cloneItems(fallback);
  }

  const items = value.flatMap((item) => {
    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [normalizedItem] : [];
  });
  const consolidatedItems = consolidateInventory(items);

  return items.length > 0 || value.length === 0
    ? consolidatedItems
    : cloneItems(fallback);
}
