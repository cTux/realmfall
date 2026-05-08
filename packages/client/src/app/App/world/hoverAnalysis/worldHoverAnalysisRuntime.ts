import { hexDistance, type HexCoord } from '../../../../game/hex';
import { isPassable } from '../../../../game/shared';
import { getCurrentWorldRevealRadius } from '../../../../game/stateOutposts';
import { getSafePathToTile } from '../../../../game/statePathfinding';
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
  const distance = hexDistance(state.player.coord, target);
  const revealRadius = getCurrentWorldRevealRadius(state);

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
