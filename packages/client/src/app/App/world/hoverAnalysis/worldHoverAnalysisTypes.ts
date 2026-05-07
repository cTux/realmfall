import type { GameState, HexCoord } from '../../../../game/stateTypes';
import type { PathfindingState } from '../../../../game/statePathfinding';

export type WorldHoverAnalysisState = PathfindingState;

export interface WorldHoverAnalysisResult {
  actionable: boolean;
  safePath: HexCoord[] | null;
}

export interface WorldHoverAnalysisSource {
  analyze(target: HexCoord): Promise<WorldHoverAnalysisResult>;
  dispose(): Promise<void>;
  syncState(state: WorldHoverAnalysisState): Promise<void>;
}

export interface WorldHoverAnalysisWorker {
  analyze(target: HexCoord): Promise<WorldHoverAnalysisResult>;
  syncState(state: WorldHoverAnalysisState): Promise<void>;
}

export function buildWorldHoverAnalysisState(
  state: GameState,
): WorldHoverAnalysisState {
  return {
    activeWorldId: state.activeWorldId,
    bloodMoonActive: state.bloodMoonActive,
    combat: state.combat,
    enemies: state.enemies,
    gameOver: state.gameOver,
    player: {
      coord: state.player.coord,
    },
    radius: state.radius,
    seed: state.seed,
    tiles: state.tiles,
    worlds: state.worlds,
  };
}
