import type { HexCoord } from './hex';
import { t } from '../i18n';
import { createCombatActorState } from './combat';
import {
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
} from './combatDamage';
import { addLog } from './logs';
import { getPlayerCombatStats } from './progression';
import { cloneForWorldMutation, message } from './stateMutationHelpers';
import { getCombatAutomationDelay, resolveCombat } from './stateCombatRuntime';
import { respawnAtNearestTown } from './stateSurvival';
import type { GameState } from './types';

export {
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
};
export { getCombatAutomationDelay };

export function attackCombatEnemy(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (!state.combat.started)
    return message(state, t('game.message.combat.pressStart'));

  return progressCombat(state);
}

export function progressCombat(state: GameState): GameState {
  if (!state.combat || !state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function startCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  next.combat!.started = true;
  next.combat!.startedAtMs = next.worldTimeMs;
  addLog(
    next,
    'combat',
    t(
      next.combat!.enemyIds.length === 1
        ? 'game.message.combat.begin.one'
        : 'game.message.combat.begin.other',
      { count: next.combat!.enemyIds.length },
    ),
  );
  resolveCombat(next);
  return next;
}

export function forfeitCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (!state.combat.started)
    return message(state, t('game.message.combat.pressStart'));

  const next = cloneForWorldMutation(state);
  respawnAtNearestTown(next, next.combat!.coord);
  return next;
}

export function createCombatState(
  state: GameState,
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
): GameState['combat'] {
  return {
    coord,
    enemyIds: [...enemyIds],
    started: false,
    player: createCombatActorState(
      worldTimeMs,
      getPlayerCombatStats(state.player).abilityIds,
    ),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatActorState(worldTimeMs, state.enemies[enemyId]?.abilityIds),
      ]),
    ),
  };
}
