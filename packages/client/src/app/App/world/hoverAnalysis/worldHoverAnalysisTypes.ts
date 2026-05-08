import { getCurrentWorldRevealRadius } from '../../../../game/stateOutposts';
import { getTileAt } from '../../../../game/stateWorldQueries';
import { hexesInRange, hexKey, type HexCoord } from '../../../../game/hex';
import type { Enemy, GameState, Tile } from '../../../../game/stateTypes';

export interface WorldHoverAnalysisState {
  combat: GameState['combat'];
  enemies: Record<string, Enemy>;
  gameOver: boolean;
  player: {
    coord: HexCoord;
  };
  radius: number;
  revealRadius: number;
  tiles: Record<string, Tile>;
}

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
  const revealRadius = getCurrentWorldRevealRadius(state);
  const maxHoverRadius = Math.max(state.radius, revealRadius);
  const tiles: Record<string, Tile> = {};
  const enemies: Record<string, Enemy> = {};

  for (const coord of hexesInRange(state.player.coord, maxHoverRadius)) {
    const tile = getTileAt(state, coord);
    const tileKey = hexKey(coord);
    tiles[tileKey] = tile;

    for (const enemyId of tile.enemyIds) {
      const enemy = state.enemies[enemyId];
      if (enemy !== undefined) {
        enemies[enemyId] = enemy;
      }
    }
  }

  return {
    combat: state.combat,
    enemies,
    gameOver: state.gameOver,
    player: {
      coord: state.player.coord,
    },
    radius: state.radius,
    revealRadius,
    tiles,
  };
}
