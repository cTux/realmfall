import { DEFAULT_ENEMY_MANA } from './combat';
import { StatusEffectTypeId } from './content/ids';
import {
  DEFAULT_CRITICAL_STRIKE_CHANCE,
  DEFAULT_CRITICAL_STRIKE_DAMAGE,
  DEFAULT_DODGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_REDUCTION,
} from './itemSecondaryStats';
import { getPlayerStats } from './progression';
import { resolveCombatProcCount } from './combatProcs';
import type {
  Enemy,
  GameState,
  PlayerStatusEffect,
  StatusEffectId,
} from './types';

export type DamageOutcome =
  | 'hit'
  | 'dodged'
  | 'blocked'
  | 'suppressed'
  | 'absorbed';

export interface DamageResolution {
  damage: number;
  outcome: DamageOutcome;
}

export function getEnemyCombatAttackSpeed(enemy: Enemy) {
  if (!enemy.statusEffects?.length) return 1;

  return Math.max(
    0.25,
    1 +
      getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Frenzy, 20) /
        100 -
      getCombatStatusValue(
        enemy.statusEffects,
        StatusEffectTypeId.Chilling,
        20,
      ) /
        100,
  );
}

export function scaleCombatCooldownMs(
  baseCooldownMs: number,
  attackSpeed: number,
) {
  const safeAttackSpeed = Math.max(0.01, attackSpeed);
  return Math.max(1, Math.round(baseCooldownMs / safeAttackSpeed));
}

export function getEnemyCombatAttack(enemy: Enemy) {
  return Math.max(
    1,
    Math.round(
      enemy.attack *
        (1 +
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Power,
            10,
          ) /
            100) *
        (1 -
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Weakened,
            15,
          ) /
            100),
    ),
  );
}

export function getEnemyCriticalStrikeChance(_enemy: Enemy) {
  return DEFAULT_CRITICAL_STRIKE_CHANCE;
}

export function getEnemyCriticalStrikeDamage(_enemy: Enemy) {
  return DEFAULT_CRITICAL_STRIKE_DAMAGE;
}

export function getEnemyDodgeChance(_enemy: Enemy) {
  return DEFAULT_DODGE_CHANCE;
}

export function getEnemySuppressDamageChance(_enemy: Enemy) {
  return DEFAULT_SUPPRESS_DAMAGE_CHANCE;
}

export function getEnemySuppressDamageReduction(_enemy: Enemy) {
  return DEFAULT_SUPPRESS_DAMAGE_REDUCTION;
}

export function getEnemyMana(enemy: Enemy) {
  return enemy.mana ?? enemy.maxMana ?? DEFAULT_ENEMY_MANA;
}

export function getEnemyCombatDefense(enemy: Enemy) {
  return Math.max(
    0,
    Math.round(
      enemy.defense *
        (1 +
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Guard,
            15,
          ) /
            100) *
        (1 -
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Shocked,
            15,
          ) /
            100),
    ),
  );
}

export function resolveIncomingDamage(
  state: GameState,
  seedKey: string,
  incomingDamage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  return resolveIncomingDamageByChances(
    state,
    seedKey,
    incomingDamage,
    playerStats.dodgeChance ?? 0,
    playerStats.blockChance ?? 0,
    playerStats.suppressDamageChance ?? 0,
    playerStats.suppressDamageReduction ?? 0,
  );
}

export function resolveIncomingDamageByChances(
  state: GameState,
  seedKey: string,
  incomingDamage: number,
  dodgeChance: number,
  blockChance: number,
  suppressDamageChance: number,
  suppressDamageReduction: number,
) {
  if (incomingDamage <= 0) {
    return { damage: 0, outcome: 'absorbed' } satisfies DamageResolution;
  }
  if (resolveCombatProcCount(state, `${seedKey}:dodge`, dodgeChance) > 0) {
    return { damage: 0, outcome: 'dodged' } satisfies DamageResolution;
  }
  if (resolveCombatProcCount(state, `${seedKey}:block`, blockChance) > 0) {
    return { damage: 0, outcome: 'blocked' } satisfies DamageResolution;
  }
  if (
    resolveCombatProcCount(state, `${seedKey}:suppress`, suppressDamageChance) >
    0
  ) {
    const suppressedDamage = Math.round(
      incomingDamage * (1 - Math.min(95, suppressDamageReduction) / 100),
    );
    return {
      damage: Math.max(1, suppressedDamage),
      outcome: 'suppressed',
    } satisfies DamageResolution;
  }

  return { damage: incomingDamage, outcome: 'hit' } satisfies DamageResolution;
}

function getCombatStatusValue(
  effects: PlayerStatusEffect[] | undefined,
  effectId: StatusEffectId,
  fallback = 0,
) {
  return (effects ?? []).reduce(
    (highest, effect) =>
      effect.id === effectId
        ? Math.max(highest, effect.value ?? fallback)
        : highest,
    0,
  );
}
