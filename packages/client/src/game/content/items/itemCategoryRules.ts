import { ItemId } from '../ids';
import type { ItemConfig } from '../types';
import { GAME_TAGS, getEquipmentSlotTag, uniqueTags } from '../tags';
import { getItemCategory as getSharedItemCategory } from '@realmfall/ui-react';

export type ItemCategory = ReturnType<typeof getSharedItemCategory>;

export const CONSUMABLE_ITEM_KEYS = new Set<string>([
  ItemId.TrailRation,
  ItemId.Apple,
  ItemId.CookedFish,
  ItemId.HomeScroll,
  ItemId.WaterFlask,
]);

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

export function getItemConfigCategory(
  config: Pick<
    ItemConfig,
    'key' | 'slot' | 'healing' | 'hunger' | 'thirst' | 'category'
  >,
): ItemCategory {
  if (config.category) return config.category;
  const category = getSharedItemCategory(config);
  if (CONSUMABLE_ITEM_KEYS.has(config.key)) return 'consumable';
  return category;
}
