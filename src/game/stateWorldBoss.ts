import { hexKey, hexNeighbors, type HexCoord } from './hex';
import type { GameState } from './types';
import { buildTile } from './world';
import { isWorldBossEnemyId } from './worldBoss';

export function isWorldBossFootprintOccupied(state: GameState, coord: HexCoord) {
  const center = getWorldBossCenterFromStateOrGeneration(state, coord);
  if (!center) return false;
  if (center.q === coord.q && center.r === coord.r) return false;

  const centerTile =
    state.tiles[hexKey(center)] ?? buildTile(state.seed, center);
  return centerTile.enemyIds.some(
    (enemyId) => Boolean(state.enemies[enemyId]) || isWorldBossEnemyId(enemyId),
  );
}

function getWorldBossCenterFromStateOrGeneration(
  state: GameState,
  coord: HexCoord,
) {
  for (const candidate of [coord, ...hexNeighbors(coord)]) {
    const loadedEnemyIds = state.tiles[hexKey(candidate)]?.enemyIds;
    if (loadedEnemyIds) {
      if (loadedEnemyIds.some(isWorldBossEnemyId)) {
        return candidate;
      }
      continue;
    }

    const generatedTile = buildTile(state.seed, candidate);
    if (generatedTile.enemyIds.some(isWorldBossEnemyId)) {
      return candidate;
    }
  }

  return null;
}
