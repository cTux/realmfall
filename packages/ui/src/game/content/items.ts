import { EquipmentSlotId, type EquipmentSlotValue, type ItemKey } from './ids';
import { GAME_TAGS, type GameTag } from './tags';

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'resource';

export interface ItemClassificationInput {
  name: string;
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
]);

const ARTIFACT_SLOTS = new Set<EquipmentSlotValue>([
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
  EquipmentSlotId.Cloak,
  EquipmentSlotId.Relic,
]);

export function hasItemTag(item: ItemClassificationInput, tag: GameTag) {
  return (item.tags ?? []).includes(tag);
}

export function getItemCategory(item: ItemClassificationInput): ItemCategory {
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

export function isConsumableItem(item: ItemClassificationInput) {
  return getItemCategory(item) === 'consumable';
}

export function isEquippableItemCategory(category: ItemCategory) {
  return (
    category === 'weapon' || category === 'armor' || category === 'artifact'
  );
}
