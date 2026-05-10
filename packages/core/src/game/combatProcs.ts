import { createRng } from './random';
import type { GameState } from './types';

export function resolveCombatProcCount(
  state: GameState,
  seedKey: string,
  chance: number,
) {
  if (chance <= 0) return 0;

  const guaranteed = Math.floor(chance / 100);
  const remainder = chance - guaranteed * 100;
  if (remainder <= 0) return guaranteed;

  const roll = createRng(
    `${state.seed}:combat-proc:${seedKey}:${state.worldTimeMs}:${state.logSequence}:${state.turn}`,
  )();
  return guaranteed + (roll < remainder / 100 ? 1 : 0);
}
