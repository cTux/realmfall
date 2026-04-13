import type { Item } from '../../types';
import { itemName } from '../i18n';
import type { ItemBuildOverrides, ItemConfig } from '../types';
import { arcaneDustItemConfig } from './arcaneDust';
import { appleItemConfig } from './apple';
import { campSpearItemConfig } from './campSpear';
import { charmNecklaceItemConfig } from './charmNecklace';
import { clothItemConfig } from './cloth';
import { coalItemConfig } from './coal';
import { cookedFishItemConfig } from './cookedFish';
import { copperBandItemConfig } from './copperBand';
import { copperLoopItemConfig } from './copperLoop';
import { copperOreItemConfig } from './copperOre';
import { fieldBootsItemConfig } from './fieldBoots';
import { goldItemConfig } from './gold';
import { hearthTotemItemConfig } from './hearthTotem';
import { herbsItemConfig } from './herbs';
import { hideBucklerItemConfig } from './hideBuckler';
import { homeScrollItemConfig } from './homeScroll';
import { ironChunksItemConfig } from './ironChunks';
import { ironOreItemConfig } from './ironOre';
import { leatherScrapsItemConfig } from './leatherScraps';
import { logsItemConfig } from './logs';
import { patchworkHoodItemConfig } from './patchworkHood';
import { rawFishItemConfig } from './rawFish';
import { recipeBookItemConfig } from './recipeBook';
import { rustKnifeItemConfig } from './rustKnife';
import { scoutHoodItemConfig } from './scoutHood';
import { scoutJerkinItemConfig } from './scoutJerkin';
import { settlerVestItemConfig } from './settlerVest';
import { sticksItemConfig } from './sticks';
import { stoneItemConfig } from './stone';
import { townKnifeItemConfig } from './townKnife';
import { trailLeggingsItemConfig } from './trailLeggings';
import { trailRationItemConfig } from './trailRation';
import { wayfarerCloakItemConfig } from './wayfarerCloak';
import { waterFlaskItemConfig } from './waterFlask';
import { workGlovesItemConfig } from './workGloves';

const RAW_ITEM_CONFIGS = [
  trailRationItemConfig,
  appleItemConfig,
  recipeBookItemConfig,
  cookedFishItemConfig,
  homeScrollItemConfig,
  goldItemConfig,
  herbsItemConfig,
  logsItemConfig,
  sticksItemConfig,
  stoneItemConfig,
  copperOreItemConfig,
  ironOreItemConfig,
  ironChunksItemConfig,
  coalItemConfig,
  rawFishItemConfig,
  clothItemConfig,
  leatherScrapsItemConfig,
  arcaneDustItemConfig,
  rustKnifeItemConfig,
  townKnifeItemConfig,
  scoutJerkinItemConfig,
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
] as const;

export const ITEM_CONFIGS: ItemConfig[] = RAW_ITEM_CONFIGS.map((config) => ({
  ...config,
  name: itemName(config.key),
}));

const ITEM_CONFIG_BY_KEY = Object.fromEntries(
  ITEM_CONFIGS.map((config) => [config.key, config]),
);

const ITEM_CONFIG_BY_NAME = Object.fromEntries(
  ITEM_CONFIGS.map((config) => [config.name, config]),
);

export function getItemConfigByKey(key: string) {
  return ITEM_CONFIG_BY_KEY[key];
}

export function getItemConfigByName(name: string) {
  return ITEM_CONFIG_BY_NAME[name];
}

export function buildItemFromConfig(
  key: string,
  overrides: ItemBuildOverrides = {},
): Item {
  const config = getItemConfigByKey(key);
  if (!config) {
    throw new Error(`Missing item config: ${key}`);
  }

  return {
    id: overrides.id ?? config.key,
    itemKey: config.key,
    recipeId: overrides.recipeId,
    kind: config.kind,
    slot: config.slot,
    name: overrides.name ?? config.name,
    quantity: overrides.quantity ?? config.defaultQuantity ?? 1,
    tier: overrides.tier ?? config.tier,
    rarity: overrides.rarity ?? config.rarity,
    power: overrides.power ?? config.power,
    defense: overrides.defense ?? config.defense,
    maxHp: overrides.maxHp ?? config.maxHp,
    healing: overrides.healing ?? config.healing,
    hunger: overrides.hunger ?? config.hunger,
    thirst: overrides.thirst ?? config.thirst ?? 0,
  };
}

export function getItemConfig(item: Pick<Item, 'itemKey' | 'name'>) {
  return (
    (item.itemKey ? getItemConfigByKey(item.itemKey) : undefined) ??
    getItemConfigByName(item.name)
  );
}

export function cloneConfiguredItem(item: Item) {
  const config = getItemConfig(item);
  if (!config) return { ...item };
  return buildItemFromConfig(config.key, {
    id: item.id,
    recipeId: item.recipeId,
    quantity: item.quantity,
    tier: item.tier,
    rarity: item.rarity,
    power: item.power,
    defense: item.defense,
    maxHp: item.maxHp,
    healing: item.healing,
    hunger: item.hunger,
    thirst: item.thirst,
  });
}
