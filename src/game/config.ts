import rawGameConfig from '../../game.config.json';

import type {
  GatheringStructureType,
  ItemRarity,
  Terrain,
} from './types';

type WeightedChanceMap<T extends string> = Record<T, number>;

interface GameChanceConfig {
  progression: {
    gatheringBonus: {
      perLevel: number;
      max: number;
    };
    itemRarity: WeightedChanceMap<Exclude<ItemRarity, 'common'>>;
  };
  worldGeneration: {
    terrain: WeightedChanceMap<Terrain>;
    enemySpawn: {
      tile: number;
    };
    loot: {
      dungeon: number;
      guardedBase: number;
      guardedPerTier: number;
      guardedMax: number;
      unguarded: number;
      bonusCache: number;
    };
    generatedItemKind: WeightedChanceMap<
      'artifact' | 'weapon' | 'offhand' | 'armor' | 'consumable'
    >;
  };
  events: {
    bloodMoon: {
      activation: number;
      enemySpawnNear: number;
      enemySpawnMid: number;
      enemySpawnFar: number;
      bonusLootExtraDropBase: number;
      bonusLootExtraDropPerRarity: number;
    };
    harvestMoon: {
      activation: number;
      resourceSpawnNear: number;
      resourceSpawnFar: number;
      resourceType: WeightedChanceMap<
        Extract<
          GatheringStructureType,
          'herbs' | 'tree' | 'copper-ore' | 'iron-ore' | 'coal-ore'
        >
      >;
    };
    earthshake: {
      activation: number;
    };
  };
  drops: {
    enemyGold: {
      base: number;
      perTier: number;
      perRarity: number;
      eliteBonus: number;
      max: number;
      bloodMoon: number;
    };
    enemyRecipe: {
      base: number;
      perTier: number;
      perRarity: number;
      max: number;
      bloodMoonBonus: number;
      bloodMoonMax: number;
    };
    homeScroll: {
      base: number;
      perRarity: number;
      max: number;
    };
    gatheringByproduct: {
      tree: number;
      ore: number;
    };
    bloodMoonItemKind: WeightedChanceMap<
      'artifact' | 'weapon' | 'offhand' | 'armor'
    >;
  };
  territories: {
    factionRegion: {
      spawn: number;
    };
    structures: WeightedChanceMap<'forge' | 'workshop' | 'camp' | 'none'>;
  };
}

export const GAME_CONFIG = rawGameConfig as GameChanceConfig;

export const WORLD_RADIUS = 8;
export const WORLD_REVEAL_RADIUS = 4;
export const HEX_SIZE = 34;

export const GAME_DAY_MINUTES = 1440;
export const GAME_DAY_DURATION_MS = 60000;
export const SUNRISE_START = 300;
export const DAYLIGHT_START = 420;
export const MOONRISE_START = 1080;
export const MOONRISE_END = 1200;

export const MAX_PLAYER_LEVEL = 100;
export const STARTING_RECIPE_IDS = ['cook-cooked-fish'] as const;
export const HOME_SCROLL_ITEM_NAME_KEY = 'game.item.home-scroll.name';

export const TOWN_SEARCH_LIMIT = 24;

export const BLOOD_MOON_SPAWN_RADIUS = 6;
export const BLOOD_MOON_STAT_SCALE = 0.1;
export const BLOOD_MOON_RISE_START = 1080;
export const BLOOD_MOON_RISE_END = 1200;
export const BLOOD_MOON_RESET_START = 420;

export const HARVEST_MOON_SPAWN_RADIUS = 4;

export const EARTHSHAKE_SPAWN_RADIUS = 2;

export const GATHERING_BONUS_PER_LEVEL =
  GAME_CONFIG.progression.gatheringBonus.perLevel;
export const GATHERING_BONUS_MAX = GAME_CONFIG.progression.gatheringBonus.max;

export const BASE_CASCADING_RARITY_CHANCES =
  GAME_CONFIG.progression.itemRarity;

export const TERRAIN_CHANCES = GAME_CONFIG.worldGeneration.terrain;
export const WORLD_ENEMY_SPAWN_CHANCE =
  GAME_CONFIG.worldGeneration.enemySpawn.tile;
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
