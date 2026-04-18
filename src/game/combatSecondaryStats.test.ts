import { describe, expect, it } from 'vitest';
import { createGame, progressCombat, startCombat } from './state';

describe('combat secondary stats', () => {
  it('applies stacked poison procs above 100% and ticks damage over time', () => {
    const game = createGame(3, 'stacked-poison-seed');
    const target = { q: 2, r: 0 };
    game.player.coord = { q: 1, r: 0 };
    game.worldTimeMs = 0;
    game.player.equipment.weapon = {
      id: 'poison-test-weapon',
      name: 'Poison Test Weapon',
      slot: 'weapon',
      quantity: 1,
      tier: 5,
      rarity: 'legendary',
      power: 1,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
      secondaryStats: [{ key: 'poisonChance', value: 200 }],
    };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Training Dummy',
      coord: target,
      tier: 1,
      hp: 20,
      maxHp: 20,
      attack: 0,
      defense: 0,
      xp: 1,
      elite: false,
      statusEffects: [],
    };

    const encountered = game.player.coord.q === 1 ? startCombat({ ...game, combat: {
      coord: target,
      enemyIds: ['enemy-2,0-0'],
      started: false,
      player: {
        abilityIds: ['kick'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 0,
        cooldownEndsAt: {},
        casting: null,
      },
      enemies: {
        'enemy-2,0-0': {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 0,
          cooldownEndsAt: {},
          casting: null,
        },
      },
    } }) : game;
    const poisonedEnemy = encountered.enemies['enemy-2,0-0'];

    expect(poisonedEnemy?.statusEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'poison',
          stacks: 2,
        }),
      ]),
    );

    encountered.worldTimeMs = 2_000;
    const afterTick = progressCombat(encountered);

    expect(afterTick.enemies['enemy-2,0-0']?.hp).toBeLessThan(
      poisonedEnemy?.hp ?? 20,
    );
  });
});
