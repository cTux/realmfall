import {
  moveToTile,
  type MoveToTileOptions,
} from '../../../game/stateMovement';
import { progressCombat, startCombat } from '../../../game/stateCombat';
import type { GameState, HexCoord } from '../../../game/stateTypes';
import type {
  GameplayTransitionResult,
  GameplayTransitionSource,
} from './gameplayTransitionSourceTypes';

export function createLocalGameplayTransitionSource(): GameplayTransitionSource {
  return {
    async dispose() {},
    async moveToTile(
      state: GameState,
      target: HexCoord,
      options?: MoveToTileOptions,
    ) {
      const next = moveToTile(state, target, options);
      return {
        changed: next !== state,
        state: next,
      } satisfies GameplayTransitionResult;
    },
    async progressCombat(state: GameState, worldTimeMs: number) {
      const timedState = {
        ...state,
        worldTimeMs,
      };
      const next = progressCombat(timedState);
      return {
        changed: next !== timedState,
        state: next,
      } satisfies GameplayTransitionResult;
    },
    async startCombat(state: GameState, worldTimeMs: number) {
      const timedState = {
        ...state,
        worldTimeMs,
      };
      const next = startCombat(timedState);
      return {
        changed: next !== timedState,
        state: next,
      } satisfies GameplayTransitionResult;
    },
  };
}
