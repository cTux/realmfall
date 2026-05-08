import type { Item } from '../../types';
import { type GameTag } from '../tags';
import {
  getItemCategory as getSharedItemCategory,
  inferItemTagsByCategory,
} from '@realmfall/ui';
import { getItemConfigByKey } from './itemCatalog';
import {
  CONSUMABLE_ITEM_KEYS,
  getItemConfigCategory,
  type ItemCategory,
} from './itemCategoryRules';
export { getItemConfigCategory, type ItemCategory } from './itemCategoryRules';

type ItemClassificationInput = Pick<Item, 'name'> &
  Partial<
    Pick<
      Item,
      | 'itemKey'
      | 'slot'
      | 'recipeId'
      | 'power'
      | 'defense'
      | 'maxHp'
      | 'healing'
      | 'hunger'
      | 'thirst'
      | 'tags'
    >
  >;

export function configOccupiesOffhand(config?: { occupiesOffhand?: boolean }) {
  return Boolean(config?.occupiesOffhand);
}

export function itemOccupiesOffhand(item?: Pick<Item, 'itemKey' | 'name'>) {
  const config = item ? getItemConfig(item) : undefined;
  return configOccupiesOffhand(config);
}

export function hasItemTag(item: ItemClassificationInput, tag: GameTag) {
  return (item.tags ?? inferItemTags(item)).includes(tag);
}

export function inferItemTags(item: ItemClassificationInput) {
  const configured = item.itemKey
    ? getItemConfigByKey(item.itemKey)
    : undefined;
  if (configured) {
    return [...(configured.tags ?? [])];
  }

  return inferItemTagsByCategory(item, getItemCategory(item));
}

export function getItemCategory(item: ItemClassificationInput): ItemCategory {
  const configured = item.itemKey
    ? getItemConfigByKey(item.itemKey)
    : undefined;
  if (configured) {
    return getItemConfigCategory(configured);
  }

  const category = getSharedItemCategory(item);
  if (
    category === 'resource' &&
    item.itemKey &&
    CONSUMABLE_ITEM_KEYS.has(item.itemKey)
  ) {
    return 'consumable';
  }
  return category;
}

export function isEquippableItemCategory(category: ItemCategory) {
  return (
    category === 'weapon' || category === 'armor' || category === 'artifact'
  );
}

function getItemConfig(item: Pick<Item, 'itemKey' | 'name'>) {
  return item.itemKey ? getItemConfigByKey(item.itemKey) : undefined;
}
