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
import { enemyKey, makeEnemy, nextEnemySpawnIndex } from './combat';
import { hexDistance, hexKey, type HexCoord } from './hex';
import { addLog, getWorldDayIndex } from './logs';
import { isPassable } from './shared';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import { ensureTileState, structureDefinition } from './world';
import type { GameState, Tile } from './types';

export function spawnBloodMoonEnemies(state: GameState) {
  let spawned = 0;
  const maxEnemiesPerTile = 3;

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
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > BLOOD_MOON_SPAWN_RADIUS) continue;
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const key = hexKey(coord);
      const tile = state.tiles[key];
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
        state.enemies[enemy.id] = enemy;
        nextIndex += 1;
        spawned += 1;
      }

      state.tiles[key] = { ...tile, enemyIds: [...tile.enemyIds] };
    }
  }

  return spawned;
}

export function spawnHarvestMoonResources(state: GameState) {
  let spawned = 0;

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
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > HARVEST_MOON_SPAWN_RADIUS) continue;
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const key = hexKey(coord);
      const tile = state.tiles[key];
      if (!canSpawnHarvestMoonResourceOnTile(state, tile)) continue;

      const rng = createRng(
        `${state.seed}:harvest-moon-spawn:${state.harvestMoonCycle}:${key}`,
      );
      if (rng() >= pickHarvestMoonSpawnChance(distance)) continue;

      const structure = pickHarvestMoonResourceType(rng());
      const definition = structureDefinition(structure);
      state.tiles[key] = {
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
  const tile = state.tiles[key];
  const enemyIds = Array.from(
    { length: 1 + Math.floor(earthshakeRng() * 3) },
    (_, index) => enemyKey(coord, index),
  );
  state.tiles[key] = {
    ...tile,
    structure: 'dungeon',
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds,
  };
  enemyIds.forEach((enemyId, index) => {
    state.enemies[enemyId] = makeEnemy(
      state.seed,
      coord,
      tile.terrain,
      index,
      'dungeon',
      state.bloodMoonActive,
    );
  });
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

  for (let dq = -searchRadius; dq <= searchRadius; dq += 1) {
    for (let dr = -searchRadius; dr <= searchRadius; dr += 1) {
      const coord = {
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > searchRadius) continue;
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const tile = state.tiles[hexKey(coord)];
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
    (left, right) =>
      hexDistance(state.player.coord, left) -
      hexDistance(state.player.coord, right),
  );
  const nearestCandidates = candidates.filter(
    (candidate) =>
      hexDistance(state.player.coord, candidate) ===
      hexDistance(state.player.coord, candidates[0] ?? state.player.coord),
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
  if (tile.structure && tile.structure !== 'dungeon') return false;
  if (isWorldBossFootprintOccupied(state, tile.coord)) return false;
  return true;
}

function isHomeHex(state: GameState, coord: HexCoord) {
  return state.homeHex.q === coord.q && state.homeHex.r === coord.r;
}
