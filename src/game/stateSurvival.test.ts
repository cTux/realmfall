import { createCombatActorState } from './combat';
import { processEnemyStatusEffects } from './combatStatus';
import { StatusEffectTypeId } from './content/ids';
import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from './config';
import { createGame, moveToTile } from './state';
import { processPlayerStatusEffects } from './stateSurvival';

describe('game state survival timing', () => {
  it('damages the player each move while hunger and thirst debuffs are active', () => {
    const game = createGame(3, 'survival-debuff-damage-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };
    game.player.hunger = 30;
    game.player.thirst = 30;
    game.player.hp = 20;

    const moved = moveToTile(game, target);

    expect(moved.player.hp).toBe(18);
    expect(moved.logs.some((entry) => /starving/i.test(entry.text))).toBe(true);
    expect(moved.logs.some((entry) => /dehydrated/i.test(entry.text))).toBe(
      true,
    );
  });

  it('keeps the day number after rolling past 23:59', () => {
    const game = createGame(3, 'day-rollover-seed');
    game.worldTimeMs =
      GAME_DAY_DURATION_MS +
      ((18 * 60 + 33) / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };
    game.player.coord = { q: 1, r: 0 };

    const next = moveToTile(game, target);
    expect(next.logs[0]?.text).toMatch(/^\[Year 1, Day 2, 18:33\] /);
  });

  it('reduces player debuff tick damage by defense', () => {
    const game = createGame(3, 'player-debuff-defense-seed');
    game.player.hp = 20;
    game.player.statusEffects = [
      {
        id: StatusEffectTypeId.Burning,
        value: 37,
        stacks: 1,
        tickIntervalMs: 1_000,
        lastProcessedAt: 0,
        expiresAt: 5_000,
      },
    ];
    game.worldTimeMs = 1_000;

    processPlayerStatusEffects(game);

    expect(game.player.hp).toBe(18);
  });

  it('reduces enemy debuff tick damage by defense', () => {
    const game = createGame(3, 'enemy-debuff-defense-seed');
    const enemyId = 'enemy-2,0-0';
    const coord = { q: 2, r: 0 };
    game.enemies[enemyId] = {
      id: enemyId,
      name: 'Training Dummy',
      coord,
      tier: 1,
      hp: 20,
      maxHp: 20,
      attack: 0,
      defense: 3,
      xp: 0,
      elite: false,
      statusEffects: [
        {
          id: StatusEffectTypeId.Burning,
          value: 5,
          stacks: 1,
          tickIntervalMs: 1_000,
          lastProcessedAt: 0,
          expiresAt: 5_000,
        },
      ],
    };
    game.combat = {
      coord,
      enemyIds: [enemyId],
      started: true,
      player: createCombatActorState(0, []),
      enemies: {
        [enemyId]: createCombatActorState(0, []),
      },
    };
    game.worldTimeMs = 1_000;

    processEnemyStatusEffects(game, () => {
      throw new Error('enemy should survive the tick');
    });

    expect(game.enemies[enemyId]?.hp).toBe(18);
  });
});
