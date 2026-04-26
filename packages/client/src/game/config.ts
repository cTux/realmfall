import rawGameConfig from '../../game.config';

import type { GameConfig } from './gameConfigSchema';

export const GAME_CONFIG: GameConfig = rawGameConfig;

export const WORLD_RADIUS = 8;
export const WORLD_REVEAL_RADIUS = 4;
export const HEX_SIZE = 34;

export const GAME_DAY_MINUTES = 1440;
export const GAME_DAY_DURATION_MS = GAME_CONFIG.worldClock.dayDurationMs;
export const SUNRISE_START = 300;
export const DAYLIGHT_START = 420;
export const MOONRISE_START = 1080;
export const MOONRISE_END = 1200;

export const COMBAT_GLOBAL_COOLDOWN_MS =
  GAME_CONFIG.balance.combat.globalCooldownMs;
export const MAX_PLAYER_LEVEL = GAME_CONFIG.balance.player.maxLevel;
export const MAX_ITEM_LEVEL = GAME_CONFIG.balance.items.maxLevel;
export const STARTING_RECIPE_IDS = ['cook-cooked-fish'] as const;
export const HOME_SCROLL_ITEM_NAME_KEY = 'game.item.home-scroll.name';

export const PLAYER_BASE_STATS = GAME_CONFIG.balance.player.baseStats;
export const ENEMY_BASE_STATS = GAME_CONFIG.balance.enemy.baseStats;
export const ENEMY_POST_LEVEL_100_PER_LEVEL =
  GAME_CONFIG.balance.enemy.postLevel100PerLevel;
export const ENEMY_RARITY_MULTIPLIERS =
  GAME_CONFIG.balance.enemy.rarityMultiplier;
export const ITEM_BASE_STAT_RANGE = GAME_CONFIG.balance.items.baseStat;
export const ITEM_SECONDARY_STAT_RANGE =
  GAME_CONFIG.balance.items.secondaryStat;
export const SECONDARY_STAT_CAP = GAME_CONFIG.balance.items.secondaryStat.cap;
export const ITEM_MODIFICATION_BALANCE = GAME_CONFIG.balance.items.modification;
export const TOWN_BUY_PRICE_BALANCE = GAME_CONFIG.balance.economy.townBuyPrice;

export const TOWN_SEARCH_LIMIT = 24;

export const BLOOD_MOON_SPAWN_RADIUS = 6;
export const BLOOD_MOON_STAT_SCALE = 1.1;
export const BLOOD_MOON_RISE_START = 1080;
export const BLOOD_MOON_RISE_END = 1200;
export const BLOOD_MOON_RESET_START = 420;

export const HARVEST_MOON_SPAWN_RADIUS = 4;

export const EARTHSHAKE_SPAWN_RADIUS = 2;

export const PLAYER_XP_BALANCE = GAME_CONFIG.progression.playerXp;
export const BASE_ENEMY_XP = PLAYER_XP_BALANCE.enemyBase;
export const PLAYER_FIRST_LEVEL_XP_REQUIREMENT =
  PLAYER_XP_BALANCE.firstLevelRequirement;
export const PLAYER_LAST_LEVEL_XP_REQUIREMENT =
  PLAYER_XP_BALANCE.lastLevelRequirement;
export const MASTERY_BASE_XP_REQUIREMENT =
  PLAYER_XP_BALANCE.masteryBaseRequirement;
export const MASTERY_XP_GROWTH_RATE = PLAYER_XP_BALANCE.masteryGrowthRate;
export const PLAYER_XP_LEVEL_DIFFERENCE_BALANCE =
  PLAYER_XP_BALANCE.levelDifference;
export const GATHERING_BONUS_PER_LEVEL =
  GAME_CONFIG.progression.gatheringBonus.perLevel;
export const GATHERING_BONUS_MAX = GAME_CONFIG.progression.gatheringBonus.max;

export const BASE_CASCADING_RARITY_CHANCES = GAME_CONFIG.progression.itemRarity;
export const ITEM_RARITY_SCALING = GAME_CONFIG.progression.itemRarityScaling;
export const TERRAIN_CHANCES = GAME_CONFIG.worldGeneration.terrain;
export const WORLD_ENEMY_SPAWN_CHANCE =
  GAME_CONFIG.worldGeneration.enemySpawn.tile;
export const WORLD_NIGHT_AMBUSH_CHANCE =
  GAME_CONFIG.worldGeneration.ambush.chance;
export const WORLD_LOOT_CHANCES = GAME_CONFIG.worldGeneration.loot;
export const WORLD_GENERATED_ITEM_KIND_CHANCES =
  GAME_CONFIG.worldGeneration.generatedItemKind;

const WORLD_GENERATED_ITEM_KIND_ORDER = [
  'artifact',
  'weapon',
  'offhand',
  'armor',
  'consumable',
] as const;

export const BLOOD_MOON_CHANCE = GAME_CONFIG.events.bloodMoon.activation;
export const BLOOD_MOON_ENEMY_SPAWN_CHANCES = {
  near: GAME_CONFIG.events.bloodMoon.enemySpawnNear,
  mid: GAME_CONFIG.events.bloodMoon.enemySpawnMid,
  far: GAME_CONFIG.events.bloodMoon.enemySpawnFar,
} as const;
export const BLOOD_MOON_EXTRA_DROP_CHANCES = {
  base: GAME_CONFIG.events.bloodMoon.bonusLootExtraDropBase,
  perRarity: GAME_CONFIG.events.bloodMoon.bonusLootExtraDropPerRarity,
} as const;

export const HARVEST_MOON_CHANCE = GAME_CONFIG.events.harvestMoon.activation;
export const HARVEST_MOON_RESOURCE_SPAWN_CHANCES = {
  near: GAME_CONFIG.events.harvestMoon.resourceSpawnNear,
  far: GAME_CONFIG.events.harvestMoon.resourceSpawnFar,
} as const;
export const HARVEST_MOON_RESOURCE_CHANCES =
  GAME_CONFIG.events.harvestMoon.resourceType;

export const EARTHSHAKE_CHANCE = GAME_CONFIG.events.earthshake.activation;

export const ENEMY_GOLD_DROP_CHANCES = GAME_CONFIG.drops.enemyGold;
export const ENEMY_RECIPE_DROP_CHANCES = GAME_CONFIG.drops.enemyRecipe;
export const ENEMY_ITEM_DROP_CHANCES = GAME_CONFIG.drops.enemyItem;
export const TERRAFORMING_CONSUMABLE_DROP_CHANCE =
  GAME_CONFIG.drops.terraformingConsumableChance;
export const ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER =
  ENEMY_ITEM_DROP_CHANCES.chance.bloodMoonMultiplier;
export const ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER =
  ENEMY_ITEM_DROP_CHANCES.chance.dungeonMultiplier;
export const HOME_SCROLL_DROP_CHANCES = GAME_CONFIG.drops.homeScroll;
export const GATHERING_BYPRODUCT_CHANCES = GAME_CONFIG.drops.gatheringByproduct;
export const BLOOD_MOON_ITEM_KIND_CHANCES = GAME_CONFIG.drops.bloodMoonItemKind;

const BLOOD_MOON_ITEM_KIND_ORDER = [
  'artifact',
  'weapon',
  'offhand',
  'armor',
] as const;

export const TERRITORY_FACTION_REGION_SPAWN_CHANCE =
  GAME_CONFIG.territories.factionRegion.spawn;
export const TERRITORY_STRUCTURE_CHANCES = GAME_CONFIG.territories.structures;

export function pickByChanceMap<T extends string>(
  roll: number,
  chances: Record<T, number>,
): T {
  const entries = Object.entries(chances) as Array<[T, number]>;
  const total = entries.reduce((sum, [, chance]) => sum + chance, 0);
  const normalizedRoll = Math.max(0, Math.min(0.999999, roll));
  let cursor = normalizedRoll * total;

  for (const [key, chance] of entries) {
    cursor -= chance;
    if (cursor <= 0) return key;
  }

  return entries[entries.length - 1]![0];
}

export function pickByDescendingChanceMap<T extends string>(
  roll: number,
  chances: Record<T, number>,
) {
  return pickByChanceMap(1 - Math.max(0, Math.min(0.999999, roll)), chances);
}

export function pickTerrainFromChanceMap(roll: number) {
  return pickByChanceMap(roll, TERRAIN_CHANCES);
}

export function resolveGuardedLootChance(tier: number) {
  return Math.min(
    WORLD_LOOT_CHANCES.guardedMax,
    WORLD_LOOT_CHANCES.guardedBase + tier * WORLD_LOOT_CHANCES.guardedPerTier,
  );
}

export function pickBloodMoonSpawnChance(distance: number) {
  if (distance <= 2) return BLOOD_MOON_ENEMY_SPAWN_CHANCES.near;
  if (distance <= 4) return BLOOD_MOON_ENEMY_SPAWN_CHANCES.mid;
  return BLOOD_MOON_ENEMY_SPAWN_CHANCES.far;
}

export function pickHarvestMoonSpawnChance(distance: number) {
  return distance <= 2
    ? HARVEST_MOON_RESOURCE_SPAWN_CHANCES.near
    : HARVEST_MOON_RESOURCE_SPAWN_CHANCES.far;
}

export function pickHarvestMoonResourceType(roll: number) {
  return pickByChanceMap(roll, HARVEST_MOON_RESOURCE_CHANCES);
}

export function pickWorldGeneratedItemKind(roll: number) {
  return pickByEqualBuckets(roll, WORLD_GENERATED_ITEM_KIND_ORDER);
}

export function pickBloodMoonItemKind(roll: number) {
  return pickByEqualBuckets(roll, BLOOD_MOON_ITEM_KIND_ORDER);
}

function pickByEqualBuckets<const T extends readonly string[]>(
  roll: number,
  values: T,
): T[number] {
  const normalizedRoll = Math.max(0, Math.min(0.999999, roll));
  const index = Math.floor(normalizedRoll * values.length);
  return values[index] ?? values[values.length - 1]!;
}
