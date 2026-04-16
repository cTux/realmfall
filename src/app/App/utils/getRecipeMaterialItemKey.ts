import { getItemConfigByKey } from '../../../game/content/items';
import { GAME_TAGS } from '../../../game/content/tags';
import type { Item } from '../../../game/types';

export function getRecipeMaterialItemKey(
  item: Pick<Item, 'itemKey' | 'tags'>,
) {
  if (!item.itemKey) return null;

  const tags = getItemConfigByKey(item.itemKey)?.tags ?? item.tags ?? [];
  return tags.includes(GAME_TAGS.item.craftingMaterial) ? item.itemKey : null;
}
