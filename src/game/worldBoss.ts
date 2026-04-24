import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import type { Terrain } from './types';
import { noise } from './shared';
import { isWorldBossTerrain, pickTerrain } from './worldTerrain';

const WORLD_BOSS_MIN_DISTANCE = 4;
const WORLD_BOSS_MIN_CENTER_SPACING = 3;
const WORLD_BOSS_SPAWN_THRESHOLD = 0.5;
const WORLD_BOSS_DISTANCE_WEIGHT = 0.03;
const WORLD_BOSS_DISTANCE_WEIGHT_CAP = 8;

export function isWorldBossCenter(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
) {
  if (!isWorldBossCandidate(seed, coord, terrain)) return false;

  const currentScore = worldBossScore(seed, coord);
  return !getNearbyWorldBossCandidates(coord).some((neighbor) => {
    const neighborTerrain = pickWorldBossTerrain(seed, neighbor);
    if (!isWorldBossCandidate(seed, neighbor, neighborTerrain)) return false;

    const neighborScore = worldBossScore(seed, neighbor);
    return (
      neighborScore > currentScore ||
      (neighborScore === currentScore &&
        compareWorldBossCenterPriority(neighbor, coord) < 0)
    );
  });
}

export function getWorldBossCenter(seed: string, coord: HexCoord) {
  const terrain = pickWorldBossTerrain(seed, coord);
  if (isWorldBossCenter(seed, coord, terrain)) {
    return coord;
  }

  return (
    hexNeighbors(coord).find((neighbor) =>
      isWorldBossCenter(seed, neighbor, pickWorldBossTerrain(seed, neighbor)),
    ) ?? null
  );
}

export function isWorldBossFootprint(seed: string, coord: HexCoord) {
  return getWorldBossCenter(seed, coord) !== null;
}

export function getPlacedWorldBossCenter(
  coord: HexCoord,
  getEnemyIds: (coord: HexCoord) => string[] | undefined,
) {
  if (getEnemyIds(coord)?.some(isWorldBossEnemyId)) {
    return coord;
  }

  return (
    hexNeighbors(coord).find((neighbor) =>
      getEnemyIds(neighbor)?.some(isWorldBossEnemyId),
    ) ?? null
  );
}

export function isWorldBossEnemy(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
) {
  return isWorldBossCenter(seed, coord, terrain);
}

export function isWorldBossEnemyId(enemyId: string) {
  return enemyId.startsWith('world-boss-');
}

export function worldBossEnemyId(coord: HexCoord) {
  return `world-boss-${hexKey(coord)}`;
}

function worldBossScore(seed: string, coord: HexCoord) {
  const ringWeight =
    Math.min(
      hexDistance(coord, { q: 0, r: 0 }),
      WORLD_BOSS_DISTANCE_WEIGHT_CAP,
    ) * WORLD_BOSS_DISTANCE_WEIGHT;
  return noise(`${seed}:world-boss`, coord) + ringWeight;
}

function pickWorldBossTerrain(seed: string, coord: HexCoord): Terrain {
  return pickTerrain(seed, coord);
}

function isWorldBossCandidate(seed: string, coord: HexCoord, terrain: Terrain) {
  if (!isWorldBossTerrain(terrain)) return false;
  if (hexDistance(coord, { q: 0, r: 0 }) < WORLD_BOSS_MIN_DISTANCE) {
    return false;
  }

  return worldBossScore(seed, coord) >= WORLD_BOSS_SPAWN_THRESHOLD;
}

function getNearbyWorldBossCandidates(coord: HexCoord) {
  const nearby: HexCoord[] = [];

  for (
    let dq = -(WORLD_BOSS_MIN_CENTER_SPACING - 1);
    dq <= WORLD_BOSS_MIN_CENTER_SPACING - 1;
    dq += 1
  ) {
    for (
      let dr = -(WORLD_BOSS_MIN_CENTER_SPACING - 1);
      dr <= WORLD_BOSS_MIN_CENTER_SPACING - 1;
      dr += 1
    ) {
      const candidate = { q: coord.q + dq, r: coord.r + dr };
      if (hexDistance(coord, candidate) === 0) continue;
      if (hexDistance(coord, candidate) >= WORLD_BOSS_MIN_CENTER_SPACING) {
        continue;
      }
      nearby.push(candidate);
    }
  }

  return nearby;
}

function compareWorldBossCenterPriority(a: HexCoord, b: HexCoord) {
  if (a.q !== b.q) return a.q - b.q;
  if (a.r !== b.r) return a.r - b.r;
  return hexKey(a).localeCompare(hexKey(b));
}
