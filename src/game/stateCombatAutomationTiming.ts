import { getAbilityDefinition } from './abilityCatalog';
import { getNextCombatStatusEffectEventAt } from './combatStatus';
import { canEnemyUseAbility, selectAbilityTargetId } from './combatTargeting';
import type { GameState } from './types';

export type CombatAutomationTimingState = {
  combat: GameState['combat'];
  player: Pick<GameState['player'], 'mana' | 'statusEffects'>;
  enemies: GameState['enemies'];
};

export function getCombatAutomationDelay(
  state: CombatAutomationTimingState,
  worldTimeMs: number,
) {
  const { combat } = state;
  if (!combat || combat.enemyIds.length === 0) return null;

  const eventTimes = [
    combat.player.casting?.endsAt,
    getNextPlayerActionableAt(state, worldTimeMs),
    getNextCombatStatusEffectEventAt(state.player.statusEffects, worldTimeMs),
    ...combat.enemyIds.flatMap((enemyId) => {
      const actor = combat.enemies[enemyId];
      if (!actor) return [] as Array<number | undefined>;

      return [
        actor.casting?.endsAt,
        getNextEnemyActionableAt(state, enemyId, worldTimeMs),
        getNextCombatStatusEffectEventAt(
          state.enemies[enemyId]?.statusEffects,
          worldTimeMs,
        ),
      ];
    }),
  ].filter((value): value is number => Number.isFinite(value));

  if (eventTimes.length === 0) return null;

  return Math.max(0, Math.min(...eventTimes) - worldTimeMs);
}

function getNextPlayerActionableAt(
  state: CombatAutomationTimingState,
  worldTimeMs: number,
) {
  const actor = state.combat?.player;
  if (!actor || actor.casting) return undefined;

  const readyTimes = actor.abilityIds.flatMap((abilityId) => {
    const ability = getAbilityDefinition(abilityId);
    const targetId = selectAbilityTargetId(
      state as GameState,
      'player',
      abilityId,
    );
    if (targetId == null) {
      return [] as number[];
    }
    if (state.player.mana < ability.manaCost) {
      return [] as number[];
    }

    return [
      Math.max(
        actor.globalCooldownEndsAt,
        actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
      ),
    ];
  });

  return readyTimes.length > 0 ? Math.min(...readyTimes) : undefined;
}

function getNextEnemyActionableAt(
  state: CombatAutomationTimingState,
  enemyId: string,
  worldTimeMs: number,
) {
  const actor = state.combat?.enemies[enemyId];
  const enemy = state.enemies[enemyId];
  if (!actor || !enemy || actor.casting) return undefined;

  const readyTimes = actor.abilityIds.flatMap((abilityId) => {
    const ability = getAbilityDefinition(abilityId);
    const targetId = selectAbilityTargetId(
      state as GameState,
      enemyId,
      abilityId,
    );
    if (
      targetId == null ||
      !canEnemyUseAbility(
        state as GameState,
        enemyId,
        abilityId,
        ability.target,
      )
    ) {
      return [] as number[];
    }
    if ((enemy.mana ?? 0) < ability.manaCost) {
      return [] as number[];
    }

    return [
      Math.max(
        actor.globalCooldownEndsAt,
        actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
      ),
    ];
  });

  return readyTimes.length > 0 ? Math.min(...readyTimes) : undefined;
}
