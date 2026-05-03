import { createCombatActorState } from './combat';
import type { HexCoord } from './hex';
import { getPlayerCombatStats } from './progression';
import { createCombatEnemyEncounterState } from './stateCombatTreasureGoblin';
import type { GameState } from './types';

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
    enemyStateById: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatEnemyEncounterState(state, enemyId, worldTimeMs),
      ]),
    ),
  };
}
