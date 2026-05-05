import { t } from '../i18n';
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
import {
  applyCombatVictoryAutoStep,
  createStartedCombatEncounter,
} from './stateCombatEngagement';
import {
  createCombatState,
  createDefaultCombatEngagement,
} from './stateCombatState';
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
export {
  applyCombatVictoryAutoStep,
  createStartedCombatEncounter,
  getCombatAutomationDelay,
  createCombatState,
};

export function attackCombatEnemy(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.noBattle'));

  return progressCombat(state);
}

export function progressCombat(state: GameState): GameState {
  if (!state.combat) return state;

  const next = cloneForWorldMutation(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function startCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.noBattle'));
  if (state.combat.started) return progressCombat(state);

  const next = cloneForWorldMutation(state);
  next.combat!.started = true;
  next.combat!.startedAtMs = next.worldTimeMs;
  next.combat!.engagement ??= createDefaultCombatEngagement(next.combat!.coord);
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
  if (!state.combat) return message(state, t('game.message.noBattle'));

  const next = cloneForWorldMutation(state);
  respawnAtNearestTown(next, next.combat!.coord);
  return next;
}
