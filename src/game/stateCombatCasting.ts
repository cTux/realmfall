import { getAbilityDefinition } from './abilityCatalog';
import {
  getEnemyCombatAttackSpeed,
  getEnemyMana,
  scaleCombatCooldownMs,
} from './combatDamage';
import {
  canActorCastAbility,
  canEnemyUseAbility,
  selectAbilityTargetId,
} from './combatTargeting';
import { getPlayerCombatStats } from './progression';
import type { AbilityId, GameState } from './types';

export function startPlayerCasts(state: GameState) {
  if (!state.combat) return false;

  const actor = state.combat.player;
  const now = state.worldTimeMs;
  if (actor.casting) return false;

  const abilityId = actor.abilityIds.find((candidate) => {
    const ability = getAbilityDefinition(candidate);
    const targetId = selectAbilityTargetId(state, 'player', candidate);
    return (
      canActorCastAbility(actor, candidate, now) &&
      state.player.mana >= ability.manaCost &&
      targetId !== null
    );
  });
  if (!abilityId) return false;

  const targetId = selectAbilityTargetId(state, 'player', abilityId);
  if (!targetId) return false;

  state.player.mana -= getAbilityDefinition(abilityId).manaCost;
  startAbilityCast(
    actor,
    abilityId,
    targetId,
    now,
    getPlayerCombatStats(state.player).attackSpeed ?? 1,
  );
  return true;
}

export function startEnemyCasts(state: GameState) {
  if (!state.combat) return false;

  const now = state.worldTimeMs;
  let changed = false;

  state.combat.enemyIds.forEach((enemyId) => {
    const actor = state.combat?.enemies[enemyId];
    if (!actor || actor.casting || !state.enemies[enemyId]) return;

    const abilityId = actor.abilityIds.find((candidate) => {
      const definition = getAbilityDefinition(candidate);
      const targetId = selectAbilityTargetId(state, enemyId, candidate);
      return (
        canActorCastAbility(actor, candidate, now) &&
        targetId !== null &&
        canEnemyUseAbility(state, enemyId, candidate, definition.target)
      );
    });

    if (!abilityId) return;

    const targetId = selectAbilityTargetId(state, enemyId, abilityId);
    if (!targetId) return;

    state.enemies[enemyId]!.mana = Math.max(
      0,
      getEnemyMana(state.enemies[enemyId]!) -
        getAbilityDefinition(abilityId).manaCost,
    );
    startAbilityCast(
      actor,
      abilityId,
      targetId,
      now,
      getEnemyCombatAttackSpeed(state.enemies[enemyId]!),
    );
    changed = true;
  });

  return changed;
}

function startAbilityCast(
  actor: NonNullable<GameState['combat']>['player'],
  abilityId: AbilityId,
  targetId: string,
  now: number,
  attackSpeed = 1,
) {
  const ability = getAbilityDefinition(abilityId);
  const effectiveGlobalCooldownMs = scaleCombatCooldownMs(
    actor.globalCooldownMs,
    attackSpeed,
  );
  const effectiveAbilityCooldownMs = scaleCombatCooldownMs(
    ability.cooldownMs,
    attackSpeed,
  );
  actor.effectiveGlobalCooldownMs = effectiveGlobalCooldownMs;
  actor.effectiveCooldownMs = {
    ...(actor.effectiveCooldownMs ?? {}),
    [abilityId]: effectiveAbilityCooldownMs,
  };
  actor.globalCooldownEndsAt = now + effectiveGlobalCooldownMs;
  actor.cooldownEndsAt[abilityId] = now + effectiveAbilityCooldownMs;
  actor.casting = {
    abilityId,
    targetId,
    endsAt: now + ability.castTimeMs,
  };
}
