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
  enemyIds: string[];
  enemySignatures: string[];
  tileKeys: string[];
  tileSignatures: string[];
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

function getWorldHoverAnalysisEnemySignature(enemy: Enemy) {
  return JSON.stringify(enemy);
}

function getWorldHoverAnalysisTileSignature(tile: Tile) {
  return JSON.stringify(tile);
}

function collectWorldHoverAnalysisSlice(state: GameState) {
  const revealRadius = getCurrentWorldRevealRadius(state);
  const maxHoverRadius = Math.max(state.radius, revealRadius);
  const tileKeys: string[] = [];
  const tileSignatures: string[] = [];
  const tiles: Record<string, Tile> = {};
  const enemyIds: string[] = [];
  const enemySignatures: string[] = [];
  const enemies: Record<string, Enemy> = {};

  for (const coord of hexesInRange(state.player.coord, maxHoverRadius)) {
    const tile = getTileAt(state, coord);
    const tileKey = hexKey(coord);
    tileKeys.push(tileKey);
    tileSignatures.push(getWorldHoverAnalysisTileSignature(tile));
    tiles[tileKey] = tile;

    for (const enemyId of tile.enemyIds) {
      if (enemies[enemyId] !== undefined) {
        continue;
      }

      const enemy = state.enemies[enemyId];
      if (enemy === undefined) {
        continue;
      }

      enemyIds.push(enemyId);
      enemySignatures.push(getWorldHoverAnalysisEnemySignature(enemy));
      enemies[enemyId] = enemy;
    }
  }

  return {
    enemies,
    enemyIds,
    enemySignatures,
    revealRadius,
    tileKeys,
    tileSignatures,
    tiles,
  };
}

export function getWorldHoverAnalysisStateInputs(
  state: GameState,
): WorldHoverAnalysisStateInputs {
  const { enemyIds, enemySignatures, revealRadius, tileKeys, tileSignatures } =
    collectWorldHoverAnalysisSlice(state);

  return {
    activeWorldId: state.activeWorldId,
    combat: state.combat,
    enemyIds,
    enemySignatures,
    gameOver: state.gameOver,
    player: state.player.coord,
    radius: state.radius,
    revealRadius,
    tileKeys,
    tileSignatures,
  };
}

function isSameSliceEntries(
  aKeys: string[],
  aSignatures: string[],
  bKeys: string[],
  bSignatures: string[],
) {
  if (
    aKeys.length !== bKeys.length ||
    aSignatures.length !== bSignatures.length
  ) {
    return false;
  }

  for (let index = 0; index < aKeys.length; index += 1) {
    if (
      aKeys[index] !== bKeys[index] ||
      aSignatures[index] !== bSignatures[index]
    ) {
      return false;
    }
  }

  return true;
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
    isSameSliceEntries(
      a.tileKeys,
      a.tileSignatures,
      b.tileKeys,
      b.tileSignatures,
    ) &&
    isSameSliceEntries(
      a.enemyIds,
      a.enemySignatures,
      b.enemyIds,
      b.enemySignatures,
    )
  );
}

export function buildWorldHoverAnalysisState(
  state: GameState,
): WorldHoverAnalysisState {
  const { enemies, revealRadius, tiles } =
    collectWorldHoverAnalysisSlice(state);

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
