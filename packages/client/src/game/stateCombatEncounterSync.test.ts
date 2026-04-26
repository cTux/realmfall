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
    };
    const initialLogCount = game.logs.length;

    syncCombatEncounterEnemies(game);

    expect(game.tiles['2,0']?.enemyIds).toEqual([]);
    expect(game.combat).toBeNull();
    expect(game.logs.length).toBe(initialLogCount + 1);
    expect(game.logs[0]?.kind).toBe('combat');
  });
});
