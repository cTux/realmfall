import { getNextCombatStatusEffectEventAt } from './combatStatus';
import { getNextActorReadyAt } from './combatTargeting';
import type { GameState } from './types';

export type CombatAutomationTimingState = {
  combat: GameState['combat'];
  player: Pick<GameState['player'], 'statusEffects'>;
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
    getNextActorReadyAt(combat.player, worldTimeMs),
    getNextCombatStatusEffectEventAt(state.player.statusEffects, worldTimeMs),
    ...combat.enemyIds.flatMap((enemyId) => {
      const actor = combat.enemies[enemyId];
      if (!actor) return [] as Array<number | undefined>;

      return [
        actor.casting?.endsAt,
        getNextActorReadyAt(actor, worldTimeMs),
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
