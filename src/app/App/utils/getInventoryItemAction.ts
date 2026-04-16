import { canUseItem, isRecipePage, type Item } from '../../../game/state';

export function getInventoryItemAction(
  item: Item | undefined,
  learnedRecipeIds: string[] = [],
) {
  if (!item) return 'equip';
  if (isRecipePage(item)) return 'use';
  if (canUseItem(item, learnedRecipeIds)) return 'use';
  return 'equip';
}
