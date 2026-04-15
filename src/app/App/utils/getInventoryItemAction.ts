import { canUseItem, isRecipeBook, type Item } from '../../../game/state';

export function getInventoryItemAction(item: Item | undefined) {
  if (!item) return 'equip';
  if (isRecipeBook(item)) return 'open-recipes';
  if (canUseItem(item)) return 'use';
  return 'equip';
}
