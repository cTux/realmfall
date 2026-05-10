import {
  applyEnemyAbility,
  applyPlayerAbility,
  handleEnemyDefeat,
} from './stateCombatAbilityResolution';
import { startEnemyCasts, startPlayerCasts } from './stateCombatCasting';
import { processEnemyStatusEffects } from './combatStatus';
import {
  processPlayerStatusEffects,
  respawnAtNearestTown,
} from './stateSurvival';
import type { GameState } from './types';

export { getCombatAutomationDelay } from './stateCombatAutomationTiming';

export function resolveCombat(state: GameState) {
  if (!state.combat) return false;

  let changed = false;
  let keepResolving = true;

  while (state.combat && keepResolving) {
    keepResolving = false;
    const playerEffectsChanged = processPlayerStatusEffects(state);
    const enemyEffectsChanged = processEnemyStatusEffects(
      state,
      handleEnemyDefeat,
    );
    if (playerEffectsChanged || enemyEffectsChanged) {
      changed = true;
      if (state.player.hp <= 0 && state.combat) {
        respawnAtNearestTown(state, state.combat.coord);
        return true;
      }
      if (!state.combat) return true;
    }

    const duePlayerCast =
      state.combat.player.casting &&
      state.combat.player.casting.endsAt <= state.worldTimeMs
        ? state.combat.player.casting
        : null;
    const dueEnemyCasts = state.combat.enemyIds
      .map((enemyId) => ({ enemyId, actor: state.combat?.enemies[enemyId] }))
      .filter((entry) => Boolean(entry.actor?.casting))
      .map(({ enemyId, actor }) => ({ enemyId, cast: actor!.casting! }))
      .filter(({ cast }) => cast.endsAt <= state.worldTimeMs);

    if (duePlayerCast || dueEnemyCasts.length > 0) {
      changed = true;
      keepResolving = true;
      if (duePlayerCast) state.combat.player.casting = null;
      dueEnemyCasts.forEach(({ enemyId }) => {
        const actor = state.combat?.enemies[enemyId];
        if (actor) actor.casting = null;
      });

      if (duePlayerCast) {
        applyPlayerAbility(
          state,
          duePlayerCast.abilityId,
          duePlayerCast.targetId,
        );
      }
      dueEnemyCasts.forEach(({ enemyId, cast }) => {
        applyEnemyAbility(state, enemyId, cast.abilityId);
      });
      if (!state.combat) return true;
    }

    const startedPlayerCast = startPlayerCasts(state);
    const startedEnemyCast = startEnemyCasts(state);
    changed = changed || startedPlayerCast || startedEnemyCast;
    keepResolving = keepResolving || startedPlayerCast || startedEnemyCast;
  }

  return changed;
}
