import type { MoveToTileOptions } from '../../../game/stateMovement';
import type { GameState, HexCoord } from '../../../game/stateTypes';

export interface GameplayTransitionResult {
  changed: boolean;
  state: GameState;
}

export interface GameplayTransitionSource {
  dispose(): Promise<void>;
  moveToTile(
    state: GameState,
    target: HexCoord,
    options?: MoveToTileOptions,
  ): Promise<GameplayTransitionResult>;
  progressCombat(
    state: GameState,
    worldTimeMs: number,
  ): Promise<GameplayTransitionResult>;
  startCombat(
    state: GameState,
    worldTimeMs: number,
  ): Promise<GameplayTransitionResult>;
}

export type GameplayTransitionWorker = Omit<
  GameplayTransitionSource,
  'dispose'
>;
