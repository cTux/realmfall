import { hexDistance, hexKey, hexNeighbors, type HexCoord } from '../../../../game/hex';
import { isPassable } from '../../../../game/shared';
import { isFactionNpcEnemyId } from '../../../../game/territories';
import { getResolvedTileAt } from '../../../../game/stateWorldQueries';
import type {
  WorldHoverAnalysisResult,
  WorldHoverAnalysisState,
} from './worldHoverAnalysisTypes';

export const EMPTY_WORLD_HOVER_ANALYSIS_RESULT: WorldHoverAnalysisResult = {
  actionable: false,
  safePath: null,
};

export function analyzeWorldHoverTarget(
  state: WorldHoverAnalysisState,
  target: HexCoord,
): WorldHoverAnalysisResult {
  if (state.gameOver || state.combat) {
    return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
  }

  const distance = hexDistance(state.player.coord, target);
  const revealRadius = state.revealRadius;

  if (distance === 0 || distance > revealRadius) {
    return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
  }

  const tile = getResolvedTileAt(state, target);
  if (!tile) {
    return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
  }

  if (distance === 1) {
    return {
      actionable: isPassable(tile.terrain),
      safePath: null,
    };
  }

  const safePath = getSafePathToTile(state, target);
  if (!safePath) {
    return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
  }

  return {
    actionable: true,
    safePath,
  };
}

function getSafePathToTile(
  state: WorldHoverAnalysisState,
  target: HexCoord,
): HexCoord[] | null {
  const start = state.player.coord;
  const queue: Array<{ coord: HexCoord; path: HexCoord[] }> = [
    { coord: start, path: [] },
  ];
  const visited = new Set([hexKey(start)]);

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) {
      break;
    }

    for (const neighbor of hexNeighbors(next.coord)) {
      if (hexDistance(start, neighbor) > state.radius) {
        continue;
      }

      if (hexDistance(start, neighbor) > state.revealRadius) {
        continue;
      }

      const key = hexKey(neighbor);
      if (visited.has(key)) {
        continue;
      }

      const tile = getResolvedTileAt(state, neighbor);
      if (!tile) {
        continue;
      }

      if (!isPassable(tile.terrain)) {
        continue;
      }

      if (
        (neighbor.q !== target.q || neighbor.r !== target.r) &&
        getHostileEnemyIds(state, neighbor).length > 0
      ) {
        continue;
      }

      const path = [...next.path, neighbor];
      if (neighbor.q === target.q && neighbor.r === target.r) {
        return path;
      }

      visited.add(key);
      queue.push({ coord: neighbor, path });
    }
  }

  return null;
}

function getHostileEnemyIds(state: WorldHoverAnalysisState, coord: HexCoord) {
  const tile = getResolvedTileAt(state, coord);
  if (!tile) {
    return [];
  }

  return tile.enemyIds.filter((enemyId) => {
    if (tile.claim?.npc?.enemyId === enemyId) {
      return false;
    }

    if (isFactionNpcEnemyId(enemyId)) {
      return false;
    }

    return state.enemies[enemyId]?.aggressive !== false;
  });
}
