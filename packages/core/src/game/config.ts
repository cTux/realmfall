import rawCoreConfig, {
  BLOOD_MOON_CONFIG,
  EARTHSHAKE_CONFIG,
  HARVEST_MOON_CONFIG,
  HOME_SCROLL_ITEM_NAME_KEY,
  OUTPOST_CONFIG,
  STARTING_RECIPE_IDS,
  WORLD_DIMENSIONS,
  WORLD_SEARCH_LIMITS,
  WORLD_TIME_UNITS,
  WORLD_TIME_WINDOWS,
} from '../core.config';

import type { GameConfig } from './gameConfigSchema';

export const GAME_CONFIG: GameConfig = rawCoreConfig;

export const WORLD_RADIUS = WORLD_DIMENSIONS.radius;
export const WORLD_REVEAL_RADIUS = WORLD_DIMENSIONS.revealRadius;
export const HEX_SIZE = WORLD_DIMENSIONS.hexSize;

export const GAME_DAY_MINUTES = WORLD_TIME_UNITS.dayMinutes;
export const WORLD_CALENDAR_DAYS_PER_YEAR =
  WORLD_TIME_UNITS.calendarDaysPerYear;
export const GAME_DAY_DURATION_MS = GAME_CONFIG.worldClock.dayDurationMs;
export const WORLD_MOVE_HEX_COOLDOWN_MS =
  GAME_CONFIG.worldClock.moveHexCooldownMs;
export const WORLD_MOVE_VISUAL_DURATION_MS =
  GAME_CONFIG.worldClock.moveHexVisualDurationMs;
export const SUNRISE_START = WORLD_TIME_WINDOWS.sunriseStart;
export const DAYLIGHT_START = WORLD_TIME_WINDOWS.daylightStart;
export const MOONRISE_START = WORLD_TIME_WINDOWS.moonriseStart;
export const MOONRISE_END = WORLD_TIME_WINDOWS.moonriseEnd;

export const COMBAT_GLOBAL_COOLDOWN_MS =
  GAME_CONFIG.balance.combat.globalCooldownMs;
export const MAX_PLAYER_LEVEL = GAME_CONFIG.balance.player.maxLevel;
export const MAX_ITEM_LEVEL = GAME_CONFIG.balance.items.maxLevel;

export const PLAYER_BASE_STATS = GAME_CONFIG.balance.player.baseStats;
export const ENEMY_BASE_STATS = GAME_CONFIG.balance.enemy.baseStats;
export const ENEMY_POST_LEVEL_100_PER_LEVEL =
  GAME_CONFIG.balance.enemy.postLevel100PerLevel;
export const ENEMY_RARITY_MULTIPLIERS =
  GAME_CONFIG.balance.enemy.rarityMultiplier;
export const TREASURE_GOBLIN_BALANCE = GAME_CONFIG.balance.enemy.treasureGoblin;
export const ITEM_BASE_STAT_RANGE = GAME_CONFIG.balance.items.baseStat;
export const ITEM_SECONDARY_STAT_RANGE =
  GAME_CONFIG.balance.items.secondaryStat;
export const SECONDARY_STAT_CAP = GAME_CONFIG.balance.items.secondaryStat.cap;
export const ITEM_MODIFICATION_BALANCE = GAME_CONFIG.balance.items.modification;
export const TOWN_BUY_PRICE_BALANCE = GAME_CONFIG.balance.economy.townBuyPrice;

export const TOWN_SEARCH_LIMIT = WORLD_SEARCH_LIMITS.townStructureRadius;

export const BLOOD_MOON_SPAWN_RADIUS = BLOOD_MOON_CONFIG.spawnRadius;
export const BLOOD_MOON_NEAR_DISTANCE_MAX = BLOOD_MOON_CONFIG.nearDistanceMax;
export const BLOOD_MOON_MID_DISTANCE_MAX = BLOOD_MOON_CONFIG.midDistanceMax;
export const BLOOD_MOON_MAX_ENEMIES_PER_TILE =
  BLOOD_MOON_CONFIG.maxEnemiesPerTile;
export const BLOOD_MOON_NEAR_SPAWN_COUNT_MAX =
  BLOOD_MOON_CONFIG.nearSpawnCountMax;
export const BLOOD_MOON_FAR_SPAWN_COUNT_MAX =
  BLOOD_MOON_CONFIG.farSpawnCountMax;
export const BLOOD_MOON_STAT_SCALE = BLOOD_MOON_CONFIG.statScale;
export const BLOOD_MOON_RISE_START = BLOOD_MOON_CONFIG.riseStart;
export const BLOOD_MOON_RISE_END = BLOOD_MOON_CONFIG.riseEnd;
export const BLOOD_MOON_RESET_START = BLOOD_MOON_CONFIG.resetStart;

export const HARVEST_MOON_SPAWN_RADIUS = HARVEST_MOON_CONFIG.spawnRadius;
export const HARVEST_MOON_NEAR_DISTANCE_MAX =
  HARVEST_MOON_CONFIG.nearDistanceMax;

export const EARTHSHAKE_SPAWN_RADIUS = EARTHSHAKE_CONFIG.spawnRadius;
export const EARTHSHAKE_DAILY_SEARCH_RADIUS_BONUS =
  EARTHSHAKE_CONFIG.dailySearchRadiusBonus;
export const EARTHSHAKE_FORCED_SEARCH_RADIUS_BONUS =
  EARTHSHAKE_CONFIG.forcedSearchRadiusBonus;

export const WATCHTOWER_REVEAL_BONUS = OUTPOST_CONFIG.watchtowerRevealBonus;
export const WATCHTOWER_INFLUENCE_RADIUS =
  OUTPOST_CONFIG.watchtowerInfluenceRadius;
export { HOME_SCROLL_ITEM_NAME_KEY, STARTING_RECIPE_IDS };

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
export const TREASURE_GOBLIN_SPAWN_CHANCE =
  GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
export const WORLD_NIGHT_AMBUSH_CHANCE =
  GAME_CONFIG.worldGeneration.ambush.chance;
export const WORLD_LOOT_CHANCES = GAME_CONFIG.worldGeneration.loot;
export const WORLD_GENERATED_ITEM_KIND_CHANCES =
  GAME_CONFIG.worldGeneration.generatedItemKind;
export const DUNGEON_ENEMY_CHASE_RADIUS =
  GAME_CONFIG.worldGeneration.dungeon.enemyMovement.chaseRadius;
export const DUNGEON_ENEMY_SPAWN_LEASH_RADIUS =
  GAME_CONFIG.worldGeneration.dungeon.enemyMovement.spawnLeashRadius;

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
export const TREASURE_GOBLIN_GOLD_MULTIPLIER =
  GAME_CONFIG.drops.enemyGold.treasureGoblinMultiplier;
export const TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS =
  GAME_CONFIG.drops.enemyItem.treasureGoblin;
export const TERRAFORMING_CONSUMABLE_DROP_CHANCE =
  GAME_CONFIG.drops.terraformingConsumableChance;
export const ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER =
  ENEMY_ITEM_DROP_CHANCES.chance.bloodMoonMultiplier;
export const ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER =
  ENEMY_ITEM_DROP_CHANCES.chance.dungeonMultiplier;
export const HOME_SCROLL_DROP_CHANCES = GAME_CONFIG.drops.homeScroll;
export const GATHERING_BYPRODUCT_CHANCES = GAME_CONFIG.drops.gatheringByproduct;
export const BLOOD_MOON_ITEM_KIND_CHANCES = GAME_CONFIG.drops.bloodMoonItemKind;

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
  if (distance <= BLOOD_MOON_NEAR_DISTANCE_MAX)
    return BLOOD_MOON_ENEMY_SPAWN_CHANCES.near;
  if (distance <= BLOOD_MOON_MID_DISTANCE_MAX)
    return BLOOD_MOON_ENEMY_SPAWN_CHANCES.mid;
  return BLOOD_MOON_ENEMY_SPAWN_CHANCES.far;
}

export function pickHarvestMoonSpawnChance(distance: number) {
  return distance <= HARVEST_MOON_NEAR_DISTANCE_MAX
    ? HARVEST_MOON_RESOURCE_SPAWN_CHANCES.near
    : HARVEST_MOON_RESOURCE_SPAWN_CHANCES.far;
}

export function pickHarvestMoonResourceType(roll: number) {
  return pickByChanceMap(roll, HARVEST_MOON_RESOURCE_CHANCES);
}

export function pickWorldGeneratedItemKind(roll: number) {
  return pickByChanceMap(roll, WORLD_GENERATED_ITEM_KIND_CHANCES);
}

export function pickBloodMoonItemKind(roll: number) {
  return pickByChanceMap(roll, BLOOD_MOON_ITEM_KIND_CHANCES);
}
