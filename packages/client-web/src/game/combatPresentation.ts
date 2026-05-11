import type { GameState } from '@realmfall/core/game/stateTypes';

export function isCombatPresentationActive(combat: GameState['combat']) {
  return combat?.started === true || combat?.startedAtMs != null;
}

export function getPresentedCombat(combat: GameState['combat']) {
  return isCombatPresentationActive(combat) ? combat : null;
}
