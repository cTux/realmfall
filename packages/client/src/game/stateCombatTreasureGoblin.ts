import { TREASURE_GOBLIN_BALANCE } from './config';
import { createRng } from './random';
import type { CombatEnemyEncounterState, Enemy, GameState } from './types';

export function createCombatEnemyEncounterState(
  state: Pick<GameState, 'seed' | 'enemies'>,
  enemyId: string,
  encounterSeed: number,
): CombatEnemyEncounterState {
  const enemy = state.enemies[enemyId];
  if (!enemy || !isTreasureGoblinEnemy(enemy)) {
    return {};
  }

  const minHits = TREASURE_GOBLIN_BALANCE.fleeHitsMin;
  const maxHits = TREASURE_GOBLIN_BALANCE.fleeHitsMax;
  const fleeHitsRequired =
    minHits +
    Math.floor(
      createRng(
        `${state.seed}:combat:treasure-goblin:${encounterSeed}:${enemyId}`,
      )() *
        (maxHits - minHits + 1),
    );

  return {
    treasureGoblin: {
      damageHitsTaken: 0,
      fleeHitsRequired,
    },
  };
}

function isTreasureGoblinEnemy(enemy: Enemy) {
  return enemy.enemyTypeId === 'treasure-goblin';
}
