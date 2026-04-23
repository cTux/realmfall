import type { Item } from '../../types';
import { EquipmentSlotId, ItemId } from '../ids';
import { itemName } from '../i18n';
import type { ItemBuildOverrides, ItemConfig } from '../types';
import {
  GAME_TAGS,
  getEquipmentSlotTag,
  uniqueTags,
  type GameTag,
} from '../tags';
import { applyRarityToItem } from '../../shared';
import { clampItemLevel, scaleMainItemStatForLevel } from '../../balance';
import {
  buildDefaultBlockChanceSecondaryStat,
  buildGeneratedMainStats,
  buildGeneratedSecondaryStats,
  hasDefaultBlockChance,
  normalizeSecondaryStats,
} from '../../itemSecondaryStats';
import { createRng } from '../../random';
import {
  GENERATED_ACCESSORY_KEYS,
  GENERATED_ARMOR_KEYS,
  GENERATED_EQUIPMENT_CONFIGS,
  GENERATED_OFFHAND_KEYS,
  GENERATED_WEAPON_KEYS,
} from '../generatedEquipment';
import { CRAFTABLE_ICON_ITEM_CONFIGS as GENERATED_CRAFTABLE_ICON_ITEM_CONFIGS } from '../generatedCraftingEquipment';
import { arcaneDustItemConfig } from './arcaneDust';
import { appleItemConfig } from './apple';
import { campSpearItemConfig } from './campSpear';
import { charmNecklaceItemConfig } from './charmNecklace';
import { clothItemConfig } from './cloth';
import { coalItemConfig } from './coal';
import { cookedFishItemConfig } from './cookedFish';
import { copperBandItemConfig } from './copperBand';
import { copperIngotItemConfig } from './copperIngot';
import { copperLoopItemConfig } from './copperLoop';
import { copperOreItemConfig } from './copperOre';
import { fieldBootsItemConfig } from './fieldBoots';
import { goldItemConfig } from './gold';
import { goldIngotItemConfig } from './goldIngot';
import { goldOreItemConfig } from './goldOre';
import { hearthTotemItemConfig } from './hearthTotem';
import { healthPotionItemConfig } from './healthPotion';
import { herbsItemConfig } from './herbs';
import { hideBucklerItemConfig } from './hideBuckler';
import { homeScrollItemConfig } from './homeScroll';
import { ironChunksItemConfig } from './ironChunks';
import { ironIngotItemConfig } from './ironIngot';
import { ironOreItemConfig } from './ironOre';
import { leatherScrapsItemConfig } from './leatherScraps';
import { logsItemConfig } from './logs';
import { manaPotionItemConfig } from './manaPotion';
import { MEAL_ITEM_CONFIGS } from './meals';
import { patchworkHoodItemConfig } from './patchworkHood';
import { platinumIngotItemConfig } from './platinumIngot';
import { platinumOreItemConfig } from './platinumOre';
import { PRODUCE_ITEM_CONFIGS } from './produce';
import { rawFishItemConfig } from './rawFish';
import { scoutHoodItemConfig } from './scoutHood';
import { settlerVestItemConfig } from './settlerVest';
import { sticksItemConfig } from './sticks';
import { stoneItemConfig } from './stone';
import { tinIngotItemConfig } from './tinIngot';
import { tinOreItemConfig } from './tinOre';
import { townKnifeItemConfig } from './townKnife';
import { trailLeggingsItemConfig } from './trailLeggings';
import { trailRationItemConfig } from './trailRation';
import { wayfarerCloakItemConfig } from './wayfarerCloak';
import { waterFlaskItemConfig } from './waterFlask';
import { workGlovesItemConfig } from './workGloves';
import { CRAFTED_EXPANSION_ITEM_CONFIGS } from './expansion';

const RAW_ITEM_CONFIGS = [
  trailRationItemConfig,
  appleItemConfig,
  healthPotionItemConfig,
  manaPotionItemConfig,
  cookedFishItemConfig,
  homeScrollItemConfig,
  goldItemConfig,
  herbsItemConfig,
  ...PRODUCE_ITEM_CONFIGS,
  logsItemConfig,
  sticksItemConfig,
  stoneItemConfig,
  copperOreItemConfig,
  copperIngotItemConfig,
  tinOreItemConfig,
  tinIngotItemConfig,
  ironOreItemConfig,
  ironChunksItemConfig,
  ironIngotItemConfig,
  goldOreItemConfig,
  goldIngotItemConfig,
  platinumOreItemConfig,
  platinumIngotItemConfig,
  coalItemConfig,
  rawFishItemConfig,
  clothItemConfig,
  leatherScrapsItemConfig,
  arcaneDustItemConfig,
  townKnifeItemConfig,
  scoutHoodItemConfig,
  campSpearItemConfig,
  hideBucklerItemConfig,
  patchworkHoodItemConfig,
  settlerVestItemConfig,
  workGlovesItemConfig,
  trailLeggingsItemConfig,
  fieldBootsItemConfig,
  copperLoopItemConfig,
  copperBandItemConfig,
  charmNecklaceItemConfig,
  wayfarerCloakItemConfig,
  hearthTotemItemConfig,
  waterFlaskItemConfig,
  ...MEAL_ITEM_CONFIGS,
  ...CRAFTED_EXPANSION_ITEM_CONFIGS,
  ...GENERATED_CRAFTABLE_ICON_ITEM_CONFIGS,
  ...GENERATED_EQUIPMENT_CONFIGS,
] as const;

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'resource';

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

const CONSUMABLE_ITEM_KEYS = new Set<string>([
  ItemId.TrailRation,
  ItemId.Apple,
  ItemId.CookedFish,
  ItemId.HomeScroll,
  ItemId.WaterFlask,
]);

const ARTIFACT_SLOTS = new Set<string>([
  EquipmentSlotId.RingLeft,
  EquipmentSlotId.RingRight,
  EquipmentSlotId.Amulet,
]);

const ARMOR_SLOTS = new Set<string>([
  EquipmentSlotId.Offhand,
  EquipmentSlotId.Head,
  EquipmentSlotId.Shoulders,
  EquipmentSlotId.Chest,
  EquipmentSlotId.Bracers,
  EquipmentSlotId.Hands,
  EquipmentSlotId.Belt,
  EquipmentSlotId.Legs,
  EquipmentSlotId.Feet,
  EquipmentSlotId.Cloak,
]);

export const ITEM_CONFIGS: ItemConfig[] = RAW_ITEM_CONFIGS.map((config) => ({
  ...config,
  name: itemName(config.key),
  icon: pickConfigIcon(config.iconPool, config.icon, config.key),
  tags: buildItemConfigTags(config),
}));

const ITEM_CONFIG_BY_KEY = Object.fromEntries(
  ITEM_CONFIGS.map((config) => [config.key, config]),
);

export function getItemConfigByKey(key: string) {
  return ITEM_CONFIG_BY_KEY[key];
}

export function buildItemFromConfig(
  key: string,
  overrides: ItemBuildOverrides = {},
): Item {
  const config = getItemConfigByKey(key);
  if (!config) {
    throw new Error(`Missing item config: ${key}`);
  }
  const tier = clampItemLevel(overrides.tier ?? config.tier);
  const rarity = overrides.rarity ?? config.rarity;
  const secondaryStatSeed = `${key}:secondary:${overrides.id ?? config.key}:${tier}:${rarity}`;
  const secondaryStatRng = createRng(secondaryStatSeed);
  const defaultSecondaryStats =
    config.secondaryStats ??
    (hasDefaultBlockChance(config)
      ? [buildDefaultBlockChanceSecondaryStat(tier, rarity, secondaryStatRng)]
      : undefined);

  return {
    id: overrides.id ?? config.key,
    itemKey: config.key,
    tags: overrides.tags ?? [...(config.tags ?? [])],
    recipeId: overrides.recipeId,
    locked: overrides.locked ?? false,
    slot: config.slot,
    icon:
      overrides.icon ??
      pickConfigIcon(config.iconPool, config.icon, overrides.id ?? config.key),
    name: overrides.name ?? config.name,
    quantity: overrides.quantity ?? config.defaultQuantity ?? 1,
    tier,
    rarity,
    power: overrides.power ?? scaleConfiguredMainStat(config.power, tier),
    defense: overrides.defense ?? scaleConfiguredMainStat(config.defense, tier),
    maxHp: overrides.maxHp ?? scaleConfiguredMainStat(config.maxHp, tier),
    healing: overrides.healing ?? config.healing,
    hunger: overrides.hunger ?? config.hunger,
    thirst: overrides.thirst ?? config.thirst ?? 0,
    secondaryStatCapacity:
      overrides.secondaryStatCapacity ??
      config.secondaryStatCapacity ??
      defaultSecondaryStats?.length,
    secondaryStats:
      overrides.secondaryStats ??
      normalizeSecondaryStats(defaultSecondaryStats),
    ...(overrides.reforgedSecondaryStatIndex === undefined
      ? {}
      : { reforgedSecondaryStatIndex: overrides.reforgedSecondaryStatIndex }),
    ...(overrides.enchantedSecondaryStatIndex === undefined
      ? {}
      : { enchantedSecondaryStatIndex: overrides.enchantedSecondaryStatIndex }),
    ...(overrides.corrupted === undefined
      ? {}
      : { corrupted: overrides.corrupted }),
    grantedAbilityId:
      overrides.grantedAbilityId ??
      pickGrantedAbilityId(config, overrides.id ?? config.key),
  };
}

export function buildGeneratedItemFromConfig(
  key: string,
  overrides: ItemBuildOverrides = {},
): Item {
  const config = getItemConfigByKey(key);
  if (!config?.generatedStats) {
    return buildItemFromConfig(key, overrides);
  }

  const tier = clampItemLevel(overrides.tier ?? config.tier);
  const rng = createRng(
    `${key}:generated:${overrides.id ?? config.key}:${tier}:${overrides.rarity ?? config.rarity}`,
  );
  const mainStats = buildGeneratedMainStats(config, tier, rng);
  const secondaryStats = buildGeneratedSecondaryStats(
    {
      config,
      tier,
      rarity: overrides.rarity ?? config.rarity,
    },
    rng,
  );
  const built = buildItemFromConfig(key, {
    ...overrides,
    tier,
    power: overrides.power ?? mainStats.power,
    defense: overrides.defense ?? mainStats.defense,
    maxHp: overrides.maxHp ?? mainStats.maxHp,
    secondaryStatCapacity:
      overrides.secondaryStatCapacity ?? secondaryStats.capacity,
    secondaryStats: overrides.secondaryStats ?? secondaryStats.stats,
    grantedAbilityId:
      overrides.grantedAbilityId ??
      pickGrantedAbilityId(config, overrides.id ?? config.key),
  });

  return applyRarityToItem(built);
}

export function getItemConfig(item: Pick<Item, 'itemKey' | 'name'>) {
  return item.itemKey ? getItemConfigByKey(item.itemKey) : undefined;
}

export function cloneConfiguredItem(item: Item) {
  const config = getItemConfig(item);
  if (!config) {
    return {
      ...item,
      tags: item.tags ?? inferItemTags(item),
    };
  }
  return buildItemFromConfig(config.key, {
    id: item.id,
    recipeId: item.recipeId,
    locked: item.locked,
    quantity: item.quantity,
    tier: item.tier,
    rarity: item.rarity,
    power: item.power,
    defense: item.defense,
    maxHp: item.maxHp,
    healing: item.healing,
    hunger: item.hunger,
    thirst: item.thirst,
    secondaryStatCapacity: item.secondaryStatCapacity,
    secondaryStats: item.secondaryStats,
    reforgedSecondaryStatIndex: item.reforgedSecondaryStatIndex,
    enchantedSecondaryStatIndex: item.enchantedSecondaryStatIndex,
    corrupted: item.corrupted,
    icon: item.icon,
    tags: item.tags ?? config.tags ?? [],
    grantedAbilityId: item.grantedAbilityId,
  });
}

export function configOccupiesOffhand(
  config?: Pick<ItemConfig, 'occupiesOffhand'>,
) {
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

function buildItemConfigTags(
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
  )
    return 'consumable';
  if (item.itemKey && CONSUMABLE_ITEM_KEYS.has(item.itemKey))
    return 'consumable';
  return 'resource';
}

export function getItemConfigCategory(
  config: Pick<
    ItemConfig,
    'key' | 'slot' | 'healing' | 'hunger' | 'thirst' | 'category'
  >,
): ItemCategory {
  if (config.category) return config.category;
  if (config.slot === EquipmentSlotId.Weapon) return 'weapon';
  if (config.slot && ARTIFACT_SLOTS.has(config.slot)) return 'artifact';
  if (config.slot && ARMOR_SLOTS.has(config.slot)) return 'armor';
  if (CONSUMABLE_ITEM_KEYS.has(config.key)) return 'consumable';
  if (config.healing > 0 || config.hunger > 0 || (config.thirst ?? 0) > 0) {
    return 'consumable';
  }
  return 'resource';
}

export function isEquippableItemCategory(category: ItemCategory) {
  return (
    category === 'weapon' || category === 'armor' || category === 'artifact'
  );
}

export function getGeneratedArmorKeys() {
  return [...GENERATED_ARMOR_KEYS];
}

export function getGeneratedAccessoryKeys() {
  return [...GENERATED_ACCESSORY_KEYS];
}

export function getGeneratedWeaponKeys() {
  return [...GENERATED_WEAPON_KEYS];
}

export function getGeneratedOffhandKeys() {
  return [...GENERATED_OFFHAND_KEYS];
}

function pickConfigIcon(
  iconPool: readonly string[] | undefined,
  fallback: string,
  seed: string,
) {
  if (!iconPool || iconPool.length === 0) return fallback;
  const hash = seededIndex(seed);
  return iconPool[hash % iconPool.length] ?? fallback;
}

function pickGrantedAbilityId(
  config: Pick<ItemConfig, 'grantedAbilityPool' | 'grantedAbilityId'>,
  seed: string,
) {
  if (config.grantedAbilityId) return config.grantedAbilityId;
  const pool = resolveGrantedAbilityPool(config);
  if (!pool || pool.length === 0) {
    return undefined;
  }

  return pool[seededIndex(seed) % pool.length];
}

function resolveGrantedAbilityPool(
  config: Pick<ItemConfig, 'grantedAbilityPool' | 'grantedAbilityId'>,
) {
  if (config.grantedAbilityId) return undefined;
  return config.grantedAbilityPool && config.grantedAbilityPool.length > 0
    ? config.grantedAbilityPool
    : undefined;
}

function seededIndex(seed: string) {
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function scaleConfiguredMainStat(value: number, tier: number) {
  return value > 0 ? scaleMainItemStatForLevel(tier) : 0;
}
