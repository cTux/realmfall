import { canUseItem, isRecipePage } from '@realmfall/core/game/stateSelectors';
import type { Item } from '@realmfall/core/game/stateTypes';

export function getInventoryItemAction(
  item: Item | undefined,
  learnedRecipeIds: string[] = [],
) {
  if (!item) return 'equip';
  if (isRecipePage(item)) return 'use';
  if (canUseItem(item, learnedRecipeIds)) return 'use';
  return 'equip';
}
