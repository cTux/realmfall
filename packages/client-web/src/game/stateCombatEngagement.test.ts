import { describe, expect, it } from 'vitest';
import { createGame } from './stateFactory';
import { createCombatState } from './stateCombatState';
import { startCombat } from './stateCombat';
import { syncCombatEncounterEnemies } from './stateCombatEncounterSync';
import {
  applyCombatVictoryAutoStep,
  createPendingCombatEncounter,
  createStartedCombatEncounter,
} from './stateCombatEngagementTestkit';

describe('stateCombatEngagement', () => {
  it('creates a pending adjacent-click encounter without moving the player first', () => {
    const game = createGame(3, 'adjacent-click-engagement');
    const targetCoord = { q: 1, r: 0 };
    const enemyId = 'enemy-1,0-0';

    game.player.coord = { q: 0, r: 0 };
    game.tiles['1,0'] = {
      coord: targetCoord,
      terrain: 'plains',
      items: [],
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: targetCoord,
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const combat = createPendingCombatEncounter(game, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord,
      worldTimeMs: game.worldTimeMs,
    });

    expect(combat?.started).toBe(false);
    expect(combat?.startedAtMs).toBeUndefined();
    expect(combat?.coord).toEqual({ q: 0, r: 0 });
    expect(combat?.engagement).toMatchObject({
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
    });
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('steps onto the preserved hostile target when the final enemy dies', () => {
    const game = createGame(3, 'victory-auto-step');
    const enemyId = 'enemy-1,0-0';
    game.player.coord = { q: 0, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    game.combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord: { q: 1, r: 0 },
      worldTimeMs: game.worldTimeMs,
    });

    const changed = applyCombatVictoryAutoStep(game);

    expect(changed).toBe(true);
    expect(game.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('keeps createCombatState and startCombat on the staged manual path', () => {
    const game = createGame(3, 'legacy-staged-combat');
    const enemyId = 'enemy-2,0-0';
    const coord = { q: 2, r: 0 };

    game.tiles['2,0'] = {
      coord,
      terrain: 'plains',
      items: [],
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord,
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 2,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.combat = createCombatState(game, coord, [enemyId], game.worldTimeMs);

    expect(game.combat?.started).toBe(false);
    expect(game.combat?.startedAtMs).toBeUndefined();

    const started = startCombat(game);

    expect(started.combat?.started).toBe(true);
    expect(started.combat?.startedAtMs).toBe(game.worldTimeMs);
  });

  it('does not apply a deferred auto-step after a roaming chase victory', () => {
    const game = createGame(3, 'victory-auto-step-sync');
    const enemyId = 'enemy-0,0-0';
    const targetCoord = { q: 1, r: 0 };
    const initialLogCount = game.logs.length;

    game.player.coord = { q: 0, r: 0 };
    game.tiles['0,0'] = {
      coord: { q: 0, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [enemyId],
    };
    game.tiles['1,0'] = {
      coord: targetCoord,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 0, r: 0 },
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: false,
      engageMode: 'enemy-chase',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord,
      worldTimeMs: game.worldTimeMs,
    });

    delete game.enemies[enemyId];

    syncCombatEncounterEnemies(game);

    expect(game.combat).toBeNull();
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
    expect(game.logs.length).toBe(initialLogCount + 2);
    expect(game.logs[0]?.kind).toBe('combat');
    expect(game.logs[1]?.kind).toBe('combat');
  });
});
