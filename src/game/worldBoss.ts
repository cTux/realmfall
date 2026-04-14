import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import type { Terrain } from './types';
import { noise } from './shared';

const WORLD_BOSS_MIN_DISTANCE = 4;
const WORLD_BOSS_SPAWN_THRESHOLD = 0.72;

export function isWorldBossCenter(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
) {
  if (terrain !== 'forest') return false;
  if (hexDistance(coord, { q: 0, r: 0 }) < WORLD_BOSS_MIN_DISTANCE) {
    return false;
  }

  const score = worldBossScore(seed, coord);
  if (score < WORLD_BOSS_SPAWN_THRESHOLD) return false;

  return hexNeighbors(coord).every((neighbor) => {
    if (pickWorldBossTerrain(seed, neighbor) !== 'forest') return true;
    return worldBossScore(seed, neighbor) < score;
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
  const ringWeight = hexDistance(coord, { q: 0, r: 0 }) * 0.03;
  return noise(`${seed}:world-boss`, coord) + ringWeight;
}

function pickWorldBossTerrain(seed: string, coord: HexCoord): Terrain {
  const roll = noise(seed, coord);
  if (roll < 0.1) return 'rift';
  if (roll < 0.2) return 'mountain';
  if (roll < 0.4) return 'forest';
  if (roll < 0.53) return 'swamp';
  if (roll < 0.67) return 'desert';
  return 'plains';
}
