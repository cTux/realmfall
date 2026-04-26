import type { Item } from '../../types';
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
import type { ItemBuildOverrides, ItemConfig } from '../types';
import { inferItemTags } from './itemClassification';
import { getItemConfigByKey } from './itemCatalog';

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
    requiredLevel: overrides.requiredLevel ?? config.requiredLevel,
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
