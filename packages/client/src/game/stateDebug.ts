import { t } from '../i18n';
import { ENEMY_CONFIGS } from './content/enemies';
import {
  buildGeneratedItemFromConfig,
  buildItemFromConfig,
  getGeneratedAccessoryKeys,
  getGeneratedArmorKeys,
  getGeneratedOffhandKeys,
  getGeneratedWeaponKeys,
} from './content/items';
import {
  syncEnemyBloodMoonState,
  makeEnemy,
  nextEnemySpawnIndex,
} from './combat';
import {
  BLOOD_MOON_RESET_START,
  BLOOD_MOON_RISE_START,
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
} from './config';
import { hexDistance, hexKey, hexesInRange } from './hex';
import { addItemToInventory } from './inventory';
import { addLog, getWorldDayIndex, worldTimeMsFromMinutes } from './logs';
import {
  cloneForPlayerMutation,
  cloneForWorldEventMutation,
} from './stateMutationHelpers';
import { syncBloodMoon, triggerEarthshake } from './stateWorldClock';
import { isPassable } from './shared';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import {
  spawnBloodMoonEnemies,
  spawnHarvestMoonResources,
} from './stateWorldEvents';
import { ensureTileState } from './world';
import type { EnemyRarity, GameState, ItemRarity } from './types';
import type { DebugEquipmentType } from './stateDebugWindow';

interface AddDebugEquipmentItemOptions {
  rarity: ItemRarity;
  type: DebugEquipmentType;
}

interface SpawnDebugEnemyOptions {
  enemyTypeId: (typeof ENEMY_CONFIGS)[number]['id'];
  rarity: EnemyRarity;
}

const DEBUG_EQUIPMENT_ITEM_KEYS: Record<DebugEquipmentType, string> = {
  weapon: requireRepresentativeKey('weapon', getGeneratedWeaponKeys()),
  offhand: requireRepresentativeKey('offhand', getGeneratedOffhandKeys()),
  armor: requireRepresentativeKey('armor', getGeneratedArmorKeys()),
  artifact: requireRepresentativeKey('artifact', getGeneratedAccessoryKeys()),
};

export function addDebugEquipmentItemToInventory(
  state: GameState,
  { rarity, type }: AddDebugEquipmentItemOptions,
) {
  const next = cloneForPlayerMutation(state);
  addItemToInventory(
    next.player.inventory,
    buildGeneratedItemFromConfig(DEBUG_EQUIPMENT_ITEM_KEYS[type], {
      id: createDebugEntityId('item', type, rarity, state),
      rarity,
      tier: Math.max(1, state.player.level),
    }),
  );
  return next;
}

export function addDebugDropItemToInventory(state: GameState, itemKey: string) {
  const next = cloneForPlayerMutation(state);
  addItemToInventory(
    next.player.inventory,
    buildItemFromConfig(itemKey, {
      id: createDebugEntityId('drop', itemKey, 'item', state),
    }),
  );
  return next;
}

export function spawnDebugEnemyNearby(
  state: GameState,
  { enemyTypeId, rarity }: SpawnDebugEnemyOptions,
) {
  const next = cloneForWorldEventMutation(state);
  const coord = findNearbyEnemySpawn(next);
  if (!coord) {
    addLog(next, 'system', 'No nearby empty hex can fit a spawned enemy.');
    return next;
  }

  ensureTileState(next, coord);
  const tile = next.tiles[hexKey(coord)];
  const index = nextEnemySpawnIndex(tile.enemyIds);
  const enemy = makeEnemy(
    next.seed,
    coord,
    tile.terrain,
    index,
    tile.structure,
    next.bloodMoonActive,
    {
      enemyTypeId,
      rarity,
    },
  );

  tile.enemyIds.push(enemy.id);
  next.enemies[enemy.id] = enemy;
  next.tiles[hexKey(coord)] = { ...tile, enemyIds: [...tile.enemyIds] };

  return next;
}

export function forceDebugBloodMoon(state: GameState) {
  const next = cloneForWorldEventMutation(state);
  next.worldTimeMs = coerceNightWorldTimeMs(state.worldTimeMs);
  next.dayPhase = 'night';
  next.bloodMoonActive = true;
  next.harvestMoonActive = false;
  next.bloodMoonCheckedTonight = true;
  next.harvestMoonCheckedTonight = true;
  syncEnemyBloodMoonState(next.enemies, true);
  const spawnedCount = spawnBloodMoonEnemies(next);
  addLog(next, 'combat', t('game.message.bloodMoon.begin'));
  if (spawnedCount > 0) {
    addLog(
      next,
      'combat',
      t(
        spawnedCount === 1
          ? 'game.message.bloodMoon.foes.one'
          : 'game.message.bloodMoon.foes.other',
        { count: spawnedCount },
      ),
    );
  }
  return next;
}

export function forceDebugHarvestMoon(state: GameState) {
  const next = cloneForWorldEventMutation(state);
  next.worldTimeMs = coerceNightWorldTimeMs(state.worldTimeMs);
  next.dayPhase = 'night';
  next.bloodMoonActive = false;
  next.harvestMoonActive = true;
  next.bloodMoonCheckedTonight = true;
  next.harvestMoonCheckedTonight = true;
  syncEnemyBloodMoonState(next.enemies, false);
  const spawnedCount = spawnHarvestMoonResources(next);
  addLog(next, 'system', t('game.message.harvestMoon.begin'));
  if (spawnedCount > 0) {
    addLog(
      next,
      'loot',
      t(
        spawnedCount === 1
          ? 'game.message.harvestMoon.hexes.one'
          : 'game.message.harvestMoon.hexes.other',
        { count: spawnedCount },
      ),
    );
  }
  return next;
}

export function setDebugMorning(state: GameState) {
  const nextDayWorldTimeMs =
    (getWorldDayIndex(state.worldTimeMs) + 1) * GAME_DAY_DURATION_MS +
    (BLOOD_MOON_RESET_START / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;

  return syncBloodMoon(state, BLOOD_MOON_RESET_START, nextDayWorldTimeMs);
}

export function setDebugNight(state: GameState) {
  const next = cloneForWorldEventMutation(state);
  const nextNightWorldTimeMs = coerceNightWorldTimeMs(state.worldTimeMs);
  const nextDayPhase =
    state.dayPhase === 'night' && nextNightWorldTimeMs === state.worldTimeMs
      ? state.dayPhase
      : 'night';

  next.worldTimeMs = nextNightWorldTimeMs;
  next.dayPhase = nextDayPhase;
  next.bloodMoonActive = false;
  next.harvestMoonActive = false;
  next.bloodMoonCheckedTonight = false;
  next.harvestMoonCheckedTonight = false;
  syncEnemyBloodMoonState(next.enemies, false);
  if (
    state.dayPhase !== 'night' ||
    state.worldTimeMs !== nextNightWorldTimeMs
  ) {
    addLog(next, 'system', t('game.message.time.nightFalls'));
  }
  return next;
}

export const triggerDebugEarthquake = triggerEarthshake;

function findNearbyEnemySpawn(state: GameState) {
  const candidates = hexesInRange(state.player.coord, 3)
    .filter((coord) => hexDistance(state.player.coord, coord) > 0)
    .sort(
      (left, right) =>
        hexDistance(state.player.coord, left) -
        hexDistance(state.player.coord, right),
    );

  for (const coord of candidates) {
    ensureTileState(state, coord);
    const tile = state.tiles[hexKey(coord)];
    if (!isPassable(tile.terrain)) continue;
    if (tile.claim) continue;
    if (tile.structure && tile.structure !== 'dungeon') continue;
    if (tile.enemyIds.length >= 3) continue;
    if (isWorldBossFootprintOccupied(state, coord)) continue;
    return coord;
  }

  return null;
}

function createDebugEntityId(
  prefix: string,
  key: string,
  variant: string,
  state: GameState,
) {
  return `debug-${prefix}-${key}-${variant}-${state.turn}-${state.logSequence}`;
}

function requireRepresentativeKey(type: DebugEquipmentType, keys: string[]) {
  const key = keys[0];
  if (key) {
    return key;
  }

  throw new Error(`Missing generated debug equipment key for ${type}.`);
}

function coerceNightWorldTimeMs(currentWorldTimeMs: number) {
  return Math.max(
    currentWorldTimeMs,
    worldTimeMsFromMinutes(BLOOD_MOON_RISE_START, currentWorldTimeMs),
  );
}
