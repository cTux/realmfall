import { expose } from 'comlink';
import { moveToTile } from '@realmfall/core/game/stateMovement';
import { progressCombat, startCombat } from '@realmfall/core/game/stateCombat';
import type { GameState, HexCoord } from '@realmfall/core/game/stateTypes';
import type { MoveToTileOptions } from '@realmfall/core/game/stateMovement';
import type {
  GameplayTransitionResult,
  GameplayTransitionWorker,
} from './gameplayTransitionSourceTypes';

const workerApi: GameplayTransitionWorker = {
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

expose(workerApi);
