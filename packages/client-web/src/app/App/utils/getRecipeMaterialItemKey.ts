import { getItemConfigByKey } from '@realmfall/core/game/content/items';
import { GAME_TAGS } from '@realmfall/core/game/content/tags';
import type { Item } from '@realmfall/core/game/stateTypes';

export function getRecipeMaterialItemKey(item: Pick<Item, 'itemKey' | 'tags'>) {
  if (!item.itemKey) return null;

  const tags = getItemConfigByKey(item.itemKey)?.tags ?? item.tags ?? [];
  return tags.includes(GAME_TAGS.item.craftingMaterial) ? item.itemKey : null;
}
