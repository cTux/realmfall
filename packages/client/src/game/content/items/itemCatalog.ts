import {
  GENERATED_ACCESSORY_KEYS,
  GENERATED_ARMOR_KEYS,
  GENERATED_EQUIPMENT_CONFIGS,
  GENERATED_OFFHAND_KEYS,
  GENERATED_WEAPON_KEYS,
} from '../generatedEquipment';
import { CRAFTABLE_ICON_ITEM_CONFIGS as GENERATED_CRAFTABLE_ICON_ITEM_CONFIGS } from '../generatedCraftingEquipment';
import { itemName } from '../i18n';
import type { ItemConfig } from '../types';
import {
  buildItemConfigTags,
  getItemConfigCategory,
} from './itemCategoryRules';
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
import { CRAFTED_EXPANSION_ITEM_CONFIGS } from './expansion';
import { fieldBootsItemConfig } from './fieldBoots';
import { flaxItemConfig } from './flax';
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
import { stringItemConfig } from './string';
import { stoneItemConfig } from './stone';
import { tinIngotItemConfig } from './tinIngot';
import { tinOreItemConfig } from './tinOre';
import { townKnifeItemConfig } from './townKnife';
import { trailLeggingsItemConfig } from './trailLeggings';
import { trailRationItemConfig } from './trailRation';
import { waterFlaskItemConfig } from './waterFlask';
import { wayfarerCloakItemConfig } from './wayfarerCloak';
import { workGlovesItemConfig } from './workGloves';
import { TERRAFORMING_CONSUMABLE_ITEM_CONFIGS } from './terraformingConsumables';

const RAW_ITEM_CONFIGS: ItemConfig[] = [
  trailRationItemConfig,
  appleItemConfig,
  healthPotionItemConfig,
  manaPotionItemConfig,
  cookedFishItemConfig,
  homeScrollItemConfig,
  goldItemConfig,
  herbsItemConfig,
  flaxItemConfig,
  ...PRODUCE_ITEM_CONFIGS,
  logsItemConfig,
  stringItemConfig,
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
  ...TERRAFORMING_CONSUMABLE_ITEM_CONFIGS,
  ...MEAL_ITEM_CONFIGS,
  ...CRAFTED_EXPANSION_ITEM_CONFIGS,
  ...GENERATED_CRAFTABLE_ICON_ITEM_CONFIGS,
  ...GENERATED_EQUIPMENT_CONFIGS,
];

export const ITEM_CONFIGS: ItemConfig[] = RAW_ITEM_CONFIGS.map((config) =>
  localizeItemConfig({
    ...config,
    icon: pickConfigIcon(config.iconPool, config.icon, config.key),
    tags: buildItemConfigTags(config),
  }),
);

const ITEM_CONFIG_BY_KEY = Object.fromEntries(
  ITEM_CONFIGS.map((config) => [config.key, config]),
);

export function getItemConfigByKey(key: string) {
  return ITEM_CONFIG_BY_KEY[key];
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

export function getConsumableItemKeys() {
  return ITEM_CONFIGS.filter(
    (config) => getItemConfigCategory(config) === 'consumable',
  ).map((config) => config.key);
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

function seededIndex(seed: string) {
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function localizeItemConfig(config: ItemConfig) {
  defineLocalizedProperty(config, 'name', () => itemName(config.key));

  return config;
}

function defineLocalizedProperty<T extends object, K extends keyof T>(
  target: T,
  key: K,
  resolve: () => NonNullable<T[K]>,
) {
  let override: T[K] | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get: () => override ?? resolve(),
    set: (value: T[K]) => {
      override = value;
    },
  });
}
