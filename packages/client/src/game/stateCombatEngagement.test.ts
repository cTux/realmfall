import { describe, expect, it } from 'vitest';
import { createGame } from './stateFactory';
import {
  applyCombatVictoryAutoStep,
  createStartedCombatEncounter,
} from './stateCombatEngagement';

describe('stateCombatEngagement', () => {
  it('creates an already-started adjacent-click encounter without moving the player first', () => {
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

    const combat = createStartedCombatEncounter(game, {
      autoStepOnVictory: true,
      engageMode: 'adjacent-click',
      enemyIds: [enemyId],
      originCoord: { q: 0, r: 0 },
      stagingCoord: { q: 0, r: 0 },
      targetCoord,
      worldTimeMs: game.worldTimeMs,
    });

    expect(combat?.started).toBe(true);
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
});
