import { canUseItem, type Item } from '../../../game/state';

export function getInventoryItemAction(
  item: Item | undefined,
  learnedRecipeIds: string[] = [],
) {
  if (!item) return 'equip';
  if (canUseItem(item, learnedRecipeIds)) return 'use';
  return 'equip';
}
