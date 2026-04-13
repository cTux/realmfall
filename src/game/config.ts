import rawGameConfig from '../../game.config.json';

interface GameConfig {
  world: {
    radius: number;
    revealRadius: number;
    hexSize: number;
  };
  time: {
    dayMinutes: number;
    dayDurationMs: number;
    sunriseStart: number;
    daylightStart: number;
    moonriseStart: number;
    moonriseEnd: number;
  };
  player: {
    maxLevel: number;
    startingRecipeIds: string[];
  };
  items: {
    recipeBookItemName: string;
    cookedFishItemName: string;
  };
  search: {
    townLimit: number;
  };
  bloodMoon: {
    spawnRadius: number;
    chance: number;
    statScale: number;
    riseStart: number;
    riseEnd: number;
    resetStart: number;
  };
  harvestMoon: {
    spawnRadius: number;
    chance: number;
  };
  earthshake: {
    spawnRadius: number;
    chance: number;
  };
  artifacts: {
    prefixes: string[];
    forms: string[];
  };
}

export const GAME_CONFIG = rawGameConfig as GameConfig;

export const WORLD_RADIUS = GAME_CONFIG.world.radius;
export const WORLD_REVEAL_RADIUS = GAME_CONFIG.world.revealRadius;
export const HEX_SIZE = GAME_CONFIG.world.hexSize;

export const GAME_DAY_MINUTES = GAME_CONFIG.time.dayMinutes;
export const GAME_DAY_DURATION_MS = GAME_CONFIG.time.dayDurationMs;
export const SUNRISE_START = GAME_CONFIG.time.sunriseStart;
export const DAYLIGHT_START = GAME_CONFIG.time.daylightStart;
export const MOONRISE_START = GAME_CONFIG.time.moonriseStart;
export const MOONRISE_END = GAME_CONFIG.time.moonriseEnd;

export const MAX_PLAYER_LEVEL = GAME_CONFIG.player.maxLevel;
export const STARTING_RECIPE_IDS = GAME_CONFIG.player.startingRecipeIds;

export const RECIPE_BOOK_ITEM_NAME = GAME_CONFIG.items.recipeBookItemName;
export const COOKED_FISH_ITEM_NAME = GAME_CONFIG.items.cookedFishItemName;

export const TOWN_SEARCH_LIMIT = GAME_CONFIG.search.townLimit;

export const BLOOD_MOON_SPAWN_RADIUS = GAME_CONFIG.bloodMoon.spawnRadius;
export const BLOOD_MOON_CHANCE = GAME_CONFIG.bloodMoon.chance;
export const BLOOD_MOON_STAT_SCALE = GAME_CONFIG.bloodMoon.statScale;
export const BLOOD_MOON_RISE_START = GAME_CONFIG.bloodMoon.riseStart;
export const BLOOD_MOON_RISE_END = GAME_CONFIG.bloodMoon.riseEnd;
export const BLOOD_MOON_RESET_START = GAME_CONFIG.bloodMoon.resetStart;

export const HARVEST_MOON_SPAWN_RADIUS = GAME_CONFIG.harvestMoon.spawnRadius;
export const HARVEST_MOON_CHANCE = GAME_CONFIG.harvestMoon.chance;

export const EARTHSHAKE_SPAWN_RADIUS = GAME_CONFIG.earthshake.spawnRadius;
export const EARTHSHAKE_CHANCE = GAME_CONFIG.earthshake.chance;

export const ARTIFACT_PREFIXES = GAME_CONFIG.artifacts.prefixes;
export const ARTIFACT_FORMS = GAME_CONFIG.artifacts.forms;
