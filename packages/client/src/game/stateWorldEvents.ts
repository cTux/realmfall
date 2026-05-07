import { t } from '../i18n';
import {
  BLOOD_MOON_SPAWN_RADIUS,
  EARTHSHAKE_CHANCE,
  EARTHSHAKE_SPAWN_RADIUS,
  HARVEST_MOON_SPAWN_RADIUS,
  pickBloodMoonSpawnChance,
  pickHarvestMoonResourceType,
  pickHarvestMoonSpawnChance,
} from './config';
import { createRng } from './random';
import { makeEnemy, nextEnemySpawnIndex } from './combat';
import {
  createSurfaceWorldAliasState,
  getSurfaceWorld,
} from './dungeons/worldState';
import { hexDistance, hexKey, type HexCoord } from './hex';
import { addLog, getWorldDayIndex } from './logs';
import { isPassable } from './shared';
import { registerDungeonEntrance } from './stateDungeonActions';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import {
  buildSurfaceTile,
  ensureTileState,
  structureDefinition,
} from './world';
import type { GameState, Tile } from './types';

export function spawnBloodMoonEnemies(state: GameState) {
  let spawned = 0;
  const maxEnemiesPerTile = 3;
  const center = getSurfaceEventCenter(state);
  const surfaceWorld = getSurfaceWorld(state);
  if (!surfaceWorld) {
    return spawned;
  }

  for (
    let dq = -BLOOD_MOON_SPAWN_RADIUS;
    dq <= BLOOD_MOON_SPAWN_RADIUS;
    dq += 1
  ) {
    for (
      let dr = -BLOOD_MOON_SPAWN_RADIUS;
      dr <= BLOOD_MOON_SPAWN_RADIUS;
      dr += 1
    ) {
      const coord = {
        q: center.q + dq,
        r: center.r + dr,
      };
      const distance = hexDistance(center, coord);
      if (distance === 0 || distance > BLOOD_MOON_SPAWN_RADIUS) continue;
      if (isHomeHex(state, coord)) continue;

      const key = hexKey(coord);
      const tile = ensureSurfaceTileState(state, coord);
      if (!canSpawnBloodMoonEnemiesOnTile(state, tile)) continue;

      const rng = createRng(
        `${state.seed}:blood-moon-spawn:${state.bloodMoonCycle}:${key}`,
      );
      const spawnChance = pickBloodMoonSpawnChance(distance);
      if (rng() >= spawnChance) continue;

      const availableSlots = Math.max(
        0,
        maxEnemiesPerTile - tile.enemyIds.length,
      );
      if (availableSlots === 0) continue;

      const count = Math.min(
        availableSlots,
        1 + Math.floor(rng() * (distance <= 2 ? 3 : 2)),
      );
      let nextIndex = nextEnemySpawnIndex(tile.enemyIds);
      for (let index = 0; index < count; index += 1) {
        const enemy = makeEnemy(
          state.seed,
          coord,
          tile.terrain,
          nextIndex,
          tile.structure,
          true,
        );
        tile.enemyIds.push(enemy.id);
        surfaceWorld.enemies[enemy.id] = enemy;
        nextIndex += 1;
        spawned += 1;
      }

      surfaceWorld.tiles[key] = { ...tile, enemyIds: [...tile.enemyIds] };
    }
  }

  return spawned;
}

export function spawnHarvestMoonResources(state: GameState) {
  let spawned = 0;
  const center = getSurfaceEventCenter(state);
  const surfaceWorld = getSurfaceWorld(state);
  if (!surfaceWorld) {
    return spawned;
  }

  for (
    let dq = -HARVEST_MOON_SPAWN_RADIUS;
    dq <= HARVEST_MOON_SPAWN_RADIUS;
    dq += 1
  ) {
    for (
      let dr = -HARVEST_MOON_SPAWN_RADIUS;
      dr <= HARVEST_MOON_SPAWN_RADIUS;
      dr += 1
    ) {
      const coord = {
        q: center.q + dq,
        r: center.r + dr,
      };
      const distance = hexDistance(center, coord);
      if (distance === 0 || distance > HARVEST_MOON_SPAWN_RADIUS) continue;
      if (isHomeHex(state, coord)) continue;

      const key = hexKey(coord);
      const tile = ensureSurfaceTileState(state, coord);
      if (!canSpawnHarvestMoonResourceOnTile(state, tile)) continue;

      const rng = createRng(
        `${state.seed}:harvest-moon-spawn:${state.harvestMoonCycle}:${key}`,
      );
      if (rng() >= pickHarvestMoonSpawnChance(distance)) continue;

      const structure = pickHarvestMoonResourceType(rng());
      const definition = structureDefinition(structure);
      surfaceWorld.tiles[key] = {
        ...tile,
        structure,
        structureHp: definition.maxHp,
        structureMaxHp: definition.maxHp,
      };
      spawned += 1;
    }
  }

  return spawned;
}

export function maybeTriggerEarthshake(state: GameState) {
  const dayIndex = getWorldDayIndex(state.worldTimeMs);
  if (state.lastEarthshakeDay === dayIndex) return;
  state.lastEarthshakeDay = dayIndex;

  const rng = createRng(`${state.seed}:earthshake:${dayIndex}`);
  if (rng() >= EARTHSHAKE_CHANCE) return;

  openEarthshakeDungeon(state, false);
}

export function openEarthshakeDungeon(state: GameState, forced: boolean) {
  const dayIndex = getWorldDayIndex(state.worldTimeMs);
  const earthshakeRng = createRng(
    `${state.seed}:earthshake:${dayIndex}:${forced ? 'forced' : 'daily'}`,
  );
  const coord = findNearbyDungeonSpawn(
    state,
    earthshakeRng,
    forced ? EARTHSHAKE_SPAWN_RADIUS + 6 : EARTHSHAKE_SPAWN_RADIUS + 3,
  );
  if (!coord) return false;

  const key = hexKey(coord);
  const surfaceWorld = getSurfaceWorld(state);
  if (!surfaceWorld) {
    return false;
  }

  const tile = ensureSurfaceTileState(state, coord);
  surfaceWorld.tiles[key] = {
    ...tile,
    structure: 'dungeon',
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
  };
  registerDungeonEntrance(state, coord);
  addLog(
    state,
    'system',
    t('game.message.earthshake.open', { q: coord.q, r: coord.r }),
  );
  return true;
}

function findNearbyDungeonSpawn(
  state: GameState,
  rng: () => number,
  searchRadius: number,
) {
  const candidates: HexCoord[] = [];
  const center = getSurfaceEventCenter(state);

  for (let dq = -searchRadius; dq <= searchRadius; dq += 1) {
    for (let dr = -searchRadius; dr <= searchRadius; dr += 1) {
      const coord = {
        q: center.q + dq,
        r: center.r + dr,
      };
      const distance = hexDistance(center, coord);
      if (distance === 0 || distance > searchRadius) continue;
      if (isHomeHex(state, coord)) continue;

      const tile = ensureSurfaceTileState(state, coord);
      if (!isPassable(tile.terrain)) continue;
      if (
        tile.structure ||
        tile.enemyIds.length > 0 ||
        tile.items.length > 0 ||
        tile.claim ||
        isWorldBossFootprintOccupied(state, coord)
      ) {
        continue;
      }
      candidates.push(coord);
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort(
    (left, right) => hexDistance(center, left) - hexDistance(center, right),
  );
  const nearestCandidates = candidates.filter(
    (candidate) =>
      hexDistance(center, candidate) ===
      hexDistance(center, candidates[0] ?? center),
  );
  return (
    nearestCandidates[Math.floor(rng() * nearestCandidates.length)] ?? null
  );
}

function canSpawnHarvestMoonResourceOnTile(state: GameState, tile: Tile) {
  return (
    isPassable(tile.terrain) &&
    !tile.claim &&
    !tile.structure &&
    tile.enemyIds.length === 0 &&
    tile.items.length === 0 &&
    !isWorldBossFootprintOccupied(state, tile.coord)
  );
}

function canSpawnBloodMoonEnemiesOnTile(state: GameState, tile: Tile) {
  if (!isPassable(tile.terrain)) return false;
  if (tile.claim) return false;
  if (tile.structure) return false;
  if (isWorldBossFootprintOccupied(state, tile.coord)) return false;
  return true;
}

function isHomeHex(state: GameState, coord: HexCoord) {
  return state.homeHex.q === coord.q && state.homeHex.r === coord.r;
}

function getSurfaceEventCenter(state: GameState) {
  return state.activeDungeon?.surfaceCoord ?? state.player.coord;
}

function ensureSurfaceTileState(state: GameState, coord: HexCoord) {
  const surfaceWorld = getSurfaceWorld(state);
  if (!surfaceWorld) {
    return buildSurfaceTile(state.seed, coord);
  }

  const surfaceState = createSurfaceWorldAliasState(state);
  ensureTileState(surfaceState, coord);
  return surfaceState.tiles[hexKey(coord)]!;
}
