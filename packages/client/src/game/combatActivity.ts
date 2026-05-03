import type { GameState } from './types';

export function isCombatActive(combat: GameState['combat']) {
  return combat?.started === true;
}

export function clearConsumableCooldownIfOutOfCombat(
  state: Pick<GameState, 'combat' | 'player'>,
) {
  if (
    isCombatActive(state.combat) ||
    (state.player.consumableCooldownEndsAt ?? 0) === 0
  ) {
    return false;
  }

  state.player.consumableCooldownEndsAt = 0;
  return true;
}
