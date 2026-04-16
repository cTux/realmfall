import { canUseItem, type Item } from '../../../game/state';

export function getInventoryItemAction(item: Item | undefined) {
  if (!item) return 'equip';
  if (canUseItem(item)) return 'use';
  return 'equip';
}
