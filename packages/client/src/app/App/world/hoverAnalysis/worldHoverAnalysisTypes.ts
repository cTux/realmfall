import { getCurrentWorldRevealRadius } from '@realmfall/core/game/stateOutposts';
import { getTileAt } from '@realmfall/core/game/stateWorldQueries';
import { hexesInRange, hexKey, type HexCoord } from '@realmfall/core/game/hex';
import type { Enemy, GameState, Tile } from '@realmfall/core/game/stateTypes';

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

export interface WorldHoverAnalysisStateInputs {
  activeWorldId: GameState['activeWorldId'];
  combat: GameState['combat'];
  gameOver: boolean;
  player: HexCoord;
  radius: GameState['radius'];
  revealRadius: number;
  enemies: Record<string, Enemy>;
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

export function getWorldHoverAnalysisStateInputs(
  state: GameState,
): WorldHoverAnalysisStateInputs {
  return {
    activeWorldId: state.activeWorldId,
    combat: state.combat,
    gameOver: state.gameOver,
    player: state.player.coord,
    radius: state.radius,
    revealRadius: getCurrentWorldRevealRadius(state),
    enemies: state.enemies,
    tiles: state.tiles,
  };
}

export function isSameWorldHoverAnalysisStateInputs(
  a: WorldHoverAnalysisStateInputs,
  b: WorldHoverAnalysisStateInputs,
) {
  return (
    a.activeWorldId === b.activeWorldId &&
    a.combat === b.combat &&
    a.gameOver === b.gameOver &&
    a.player.q === b.player.q &&
    a.player.r === b.player.r &&
    a.radius === b.radius &&
    a.revealRadius === b.revealRadius &&
    a.enemies === b.enemies &&
    a.tiles === b.tiles
  );
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
