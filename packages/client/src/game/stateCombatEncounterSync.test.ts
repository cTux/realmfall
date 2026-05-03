import { describe, expect, it } from 'vitest';
import { createCombatActorState } from './combat';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
import { createGame } from './stateFactory';

describe('combat encounter sync', () => {
  it('removes defeated enemies from the tile and closes combat after the last enemy dies', () => {
    const game = createGame(3, 'combat-sync');
    const coord = { q: 2, r: 0 };
    const enemyId = 'enemy-2,0-0';

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [enemyId],
    };
    game.combat = {
      coord,
      enemyIds: [enemyId],
      started: true,
      player: createCombatActorState(0, ['kick']),
      enemies: {
        [enemyId]: createCombatActorState(0, ['kick']),
      },
      enemyStateById: {
        [enemyId]: {
          treasureGoblin: {
            damageHitsTaken: 1,
            fleeHitsRequired: 3,
          },
        },
      },
    };
    const initialLogCount = game.logs.length;

    syncCombatEncounterEnemies(game);

    expect(game.tiles['2,0']?.enemyIds).toEqual([]);
    expect(game.combat).toBeNull();
    expect(game.logs.length).toBe(initialLogCount + 1);
    expect(game.logs[0]?.kind).toBe('combat');
  });

  it('drops combat encounter metadata when an enemy leaves the encounter', () => {
    const game = createGame(3, 'combat-sync-metadata');
    const coord = { q: 2, r: 0 };
    const survivingEnemyId = 'enemy-2,0-1';
    const removedEnemyId = 'enemy-2,0-0';

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [survivingEnemyId],
    };
    game.enemies[survivingEnemyId] = {
      id: survivingEnemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord,
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.combat = {
      coord,
      enemyIds: [removedEnemyId, survivingEnemyId],
      started: true,
      player: createCombatActorState(0, ['kick']),
      enemies: {
        [removedEnemyId]: createCombatActorState(0, ['kick']),
        [survivingEnemyId]: createCombatActorState(0, ['kick']),
      },
      enemyStateById: {
        [removedEnemyId]: {
          treasureGoblin: {
            damageHitsTaken: 2,
            fleeHitsRequired: 4,
          },
        },
        [survivingEnemyId]: {},
      },
    };

    syncCombatEncounterEnemies(game);

    expect(game.combat?.enemyIds).toEqual([survivingEnemyId]);
    expect(game.combat?.enemyStateById).toEqual({
      [survivingEnemyId]: {},
    });
  });
});
