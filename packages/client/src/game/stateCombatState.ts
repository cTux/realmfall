import { createCombatActorState } from './combat';
import type { HexCoord } from './hex';
import { getPlayerCombatStats } from './progression';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import type { CombatEngagementMetadata, GameState } from './types';

export function createDefaultCombatEngagement(
  coord: HexCoord,
): CombatEngagementMetadata {
  return {
    engageMode: 'tile-step',
    originCoord: { ...coord },
    stagingCoord: { ...coord },
    targetCoord: { ...coord },
    autoStepOnVictory: false,
  };
}

export function cloneCombatEngagementMetadata(
  engagement: CombatEngagementMetadata,
): CombatEngagementMetadata {
  return {
    autoStepOnVictory: engagement.autoStepOnVictory,
    engageMode: engagement.engageMode,
    originCoord: { ...engagement.originCoord },
    stagingCoord: { ...engagement.stagingCoord },
    targetCoord: engagement.targetCoord ? { ...engagement.targetCoord } : null,
  };
}

export function createCombatState(
  state: GameState,
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
  engagement = createDefaultCombatEngagement(coord),
): GameState['combat'] {
  return {
    coord: { ...coord },
    enemyIds: [...enemyIds],
    started: true,
    startedAtMs: worldTimeMs,
    engagement: cloneCombatEngagementMetadata(engagement),
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
    enemyStateById: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatEnemyEncounterState(state, enemyId, worldTimeMs),
      ]),
    ),
  };
}

export function syncCombatPlayerLoadout(
  state: Pick<GameState, 'combat' | 'player'>,
) {
  if (!state.combat) return;

  const abilityIds = getPlayerCombatStats(state.player).abilityIds;
  state.combat.player.abilityIds = [...abilityIds];
  if (
    state.combat.player.casting &&
    !abilityIds.includes(state.combat.player.casting.abilityId)
  ) {
    state.combat.player.casting = null;
  }
}
