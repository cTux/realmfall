import { createGame, moveToTile } from './state';
import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from './config';

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
});
