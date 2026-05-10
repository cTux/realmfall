import { EquipmentSlotId, type EquipmentSlotValue, type ItemKey } from '../ids';
import {
  GAME_TAGS,
  getEquipmentSlotTag,
  type GameTag,
  uniqueTags,
} from '../tags';
import { ItemId } from '../ids';
import type { ItemConfig } from '../types';

export type ItemCategory = 'weapon' | 'armor' | 'artifact' | 'consumable' | 'resource';

export interface ItemClassificationInput {
  name?: string;
  itemKey?: ItemKey;
  slot?: EquipmentSlotValue;
  recipeId?: string;
  power?: number;
  defense?: number;
  maxHp?: number;
  healing?: number;
  hunger?: number;
  thirst?: number;
  tags?: GameTag[];
}

const ARMOR_SLOTS = new Set<EquipmentSlotValue>([
  EquipmentSlotId.Head,
  EquipmentSlotId.Shoulders,
  EquipmentSlotId.Chest,
  EquipmentSlotId.Bracers,
  EquipmentSlotId.Hands,
  EquipmentSlotId.Belt,
  EquipmentSlotId.Legs,
  EquipmentSlotId.Feet,
  EquipmentSlotId.Offhand,
  EquipmentSlotId.Cloak,
]);

const ARTIFACT_SLOTS = new Set<EquipmentSlotValue>([
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
  EquipmentSlotId.Relic,
]);

export function hasItemTag(item: ItemClassificationInput, tag: GameTag) {
  return (item.tags ?? []).includes(tag);
}

export function getItemCategory(item: ItemClassificationInput): ItemCategory {
  return getSharedItemCategory(item);
}

function getSharedItemCategory(item: ItemClassificationInput): ItemCategory {
  if (hasItemTag(item, GAME_TAGS.item.weapon)) return 'weapon';
  if (hasItemTag(item, GAME_TAGS.item.armor)) return 'armor';
  if (hasItemTag(item, GAME_TAGS.item.artifact)) return 'artifact';
  if (
    hasItemTag(item, GAME_TAGS.item.consumable) ||
    hasItemTag(item, GAME_TAGS.item.food) ||
    hasItemTag(item, GAME_TAGS.item.drink) ||
    hasItemTag(item, GAME_TAGS.item.healing)
  ) {
    return 'consumable';
  }
  if (
    hasItemTag(item, GAME_TAGS.item.resource) ||
    hasItemTag(item, GAME_TAGS.item.recipe)
  ) {
    return 'resource';
  }

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

  return 'resource';
}

export function buildItemConfigTags(
  config: Omit<ItemConfig, 'name'> & { name?: string },
) {
  const category = getItemConfigCategory(config);
  return uniqueTags(
    ...(config.tags ?? []),
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
    config.slot ? getEquipmentSlotTag(config.slot) : undefined,
    config.hunger > 0 ? GAME_TAGS.item.food : undefined,
    (config.thirst ?? 0) > 0 ? GAME_TAGS.item.drink : undefined,
    config.healing > 0 ? GAME_TAGS.item.healing : undefined,
  );
}

export const CONSUMABLE_ITEM_KEYS = new Set<ItemKey>([
  ItemId.TrailRation,
  ItemId.Apple,
  ItemId.CookedFish,
  ItemId.HomeScroll,
  ItemId.WaterFlask,
]);

export function getItemConfigCategory(
  config: Pick<
    ItemConfig,
    'key' | 'slot' | 'healing' | 'hunger' | 'thirst' | 'category'
  >,
): ItemCategory {
  if (config.category) return config.category;
  const category = getSharedItemCategory(config);
  if (CONSUMABLE_ITEM_KEYS.has(config.key)) {
    return 'consumable';
  }

  return category;
}

export function inferItemTagsByCategory(
  item: ItemClassificationInput,
  category: ItemCategory,
) {
  return uniqueTags(
    ...(item.tags ?? []),
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
    item.healing && item.healing > 0 ? GAME_TAGS.item.healing : undefined,
    item.hunger && item.hunger > 0 ? GAME_TAGS.item.food : undefined,
    item.thirst && item.thirst > 0 ? GAME_TAGS.item.drink : undefined,
  );
}

export function isEquippableItemCategory(category: ItemCategory) {
  return category === 'weapon' || category === 'armor' || category === 'artifact';
}

export function isConsumableItem(item: ItemClassificationInput) {
  return getItemCategory(item) === 'consumable';
}

export function isConfiguredConsumableKey(itemKey?: string) {
  return !!itemKey && CONSUMABLE_ITEM_KEYS.has(itemKey);
}
