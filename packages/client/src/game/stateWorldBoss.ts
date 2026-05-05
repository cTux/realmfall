import { hexKey, hexNeighbors, type HexCoord } from './hex';
import type { GameState } from './types';
import { buildTileForState } from './world';
import { isWorldBossEnemyId } from './worldBoss';

type WorldBossLookupState = Pick<GameState, 'enemies' | 'seed' | 'tiles'> &
  Partial<Pick<GameState, 'activeWorldId' | 'worlds'>>;

export function isWorldBossFootprintOccupied(
  state: WorldBossLookupState,
  coord: HexCoord,
) {
  const center = getWorldBossCenterFromStateOrGeneration(state, coord);
  if (!center) return false;
  if (center.q === coord.q && center.r === coord.r) return false;

  const centerTile =
    state.tiles[hexKey(center)] ?? buildTileForState(state, center);
  return centerTile.enemyIds.some(
    (enemyId) => Boolean(state.enemies[enemyId]) || isWorldBossEnemyId(enemyId),
  );
}

function getWorldBossCenterFromStateOrGeneration(
  state: WorldBossLookupState,
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

    const generatedTile = buildTileForState(state, candidate);
    if (generatedTile.enemyIds.some(isWorldBossEnemyId)) {
      return candidate;
    }
  }

  return null;
}
