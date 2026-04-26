import { addCommandLog } from '../../../game/logs';
import type { GameState } from '../../../game/stateTypes';

interface LoggedGameTransitionOptions {
  describe: (previous: GameState, next: GameState) => string;
  transition: (state: GameState) => GameState;
}

export function createLoggedGameTransition({
  describe,
  transition,
}: LoggedGameTransitionOptions) {
  return (state: GameState) => {
    const next = transition(state);
    if (next === state) {
      return next;
    }

    addCommandLog(next, describe(state, next));
    return next;
  };
}
