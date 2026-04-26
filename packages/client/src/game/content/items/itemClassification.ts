import type { Item } from '../../types';
import { EquipmentSlotId } from '../ids';
import {
  GAME_TAGS,
  getEquipmentSlotTag,
  uniqueTags,
  type GameTag,
} from '../tags';
import { getItemConfigByKey } from './itemCatalog';
import {
  ARMOR_SLOTS,
  ARTIFACT_SLOTS,
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
  if (configured) return [...(configured.tags ?? [])];

  const category = getItemCategory(item);

  return uniqueTags(
    category === 'consumable' || category === 'resource'
      ? GAME_TAGS.item.stackable
      : undefined,
    category === 'consumable' ? GAME_TAGS.item.consumable : undefined,
    category === 'resource' ? GAME_TAGS.item.resource : undefined,
    category === 'weapon' || category === 'armor' || category === 'artifact'
      ? GAME_TAGS.item.equipment
      : undefined,
    category === 'weapon' ? GAME_TAGS.item.weapon : undefined,
    category === 'armor' ? GAME_TAGS.item.armor : undefined,
    category === 'artifact' ? GAME_TAGS.item.artifact : undefined,
    item.slot ? getEquipmentSlotTag(item.slot) : undefined,
    (item.healing ?? 0) > 0 ? GAME_TAGS.item.healing : undefined,
    (item.hunger ?? 0) > 0 ? GAME_TAGS.item.food : undefined,
    (item.thirst ?? 0) > 0 ? GAME_TAGS.item.drink : undefined,
  );
}

export function getItemCategory(item: ItemClassificationInput): ItemCategory {
  const configured = item.itemKey
    ? getItemConfigByKey(item.itemKey)
    : undefined;
  if (configured) {
    return getItemConfigCategory(configured);
  }

  const tags = item.tags ?? [];
  if (tags.includes(GAME_TAGS.item.weapon)) return 'weapon';
  if (tags.includes(GAME_TAGS.item.armor)) return 'armor';
  if (tags.includes(GAME_TAGS.item.artifact)) return 'artifact';
  if (tags.includes(GAME_TAGS.item.consumable)) return 'consumable';
  if (tags.includes(GAME_TAGS.item.resource)) return 'resource';

  if (item.slot === EquipmentSlotId.Weapon) return 'weapon';
  if (item.slot && ARTIFACT_SLOTS.has(item.slot)) return 'artifact';
  if (item.slot && ARMOR_SLOTS.has(item.slot)) return 'armor';
  if (item.recipeId) return 'resource';
  if (
    (item.power ?? 0) > 0 &&
    (item.defense ?? 0) <= 0 &&
    (item.maxHp ?? 0) <= 0
  ) {
    return 'weapon';
  }
  if ((item.defense ?? 0) > 0 && (item.power ?? 0) <= 0) {
    return 'armor';
  }
  if ((item.power ?? 0) > 0 || (item.maxHp ?? 0) > 0) {
    return 'artifact';
  }
  if (
    (item.healing ?? 0) > 0 ||
    (item.hunger ?? 0) > 0 ||
    (item.thirst ?? 0) > 0
  ) {
    return 'consumable';
  }
  if (item.itemKey && CONSUMABLE_ITEM_KEYS.has(item.itemKey)) {
    return 'consumable';
  }
  return 'resource';
}

export function isEquippableItemCategory(category: ItemCategory) {
  return (
    category === 'weapon' || category === 'armor' || category === 'artifact'
  );
}

function getItemConfig(item: Pick<Item, 'itemKey' | 'name'>) {
  return item.itemKey ? getItemConfigByKey(item.itemKey) : undefined;
}
