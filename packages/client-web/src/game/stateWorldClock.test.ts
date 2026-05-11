import { describe, expect, it } from 'vitest';
import { makeEnemy } from './combat';
import { activateDungeonWorld } from './stateDungeonActions';
import { createGame } from './stateFactory';
import { syncBloodMoon } from './stateWorldClockTestkit';
import type { GameState } from './types';

function getDungeonWorld(game: GameState, dungeonId: string) {
  const world = game.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    throw new Error('Expected a dungeon world.');
  }

  return world;
}

describe('stateWorldClock', () => {
  it('keeps blood moon stat sync on the surface world only', () => {
    const game = createGame(6, 'blood-moon-surface-only-world-sync');
    const entranceCoord = { q: 1, r: 0 };
    const surfaceEnemyCoord = { q: 3, r: 0 };
    const surfaceEnemyId = 'surface-enemy';

    game.player.coord = entranceCoord;
    game.tiles['1,0'] = {
      coord: entranceCoord,
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    game.worlds[game.surfaceWorldId]!.tiles['3,0'] = {
      coord: surfaceEnemyCoord,
      terrain: 'plains',
      structure: undefined,
      items: [],
      enemyIds: [surfaceEnemyId],
    };
    game.worlds[game.surfaceWorldId]!.enemies[surfaceEnemyId] = makeEnemy(
      game.seed,
      surfaceEnemyCoord,
      'plains',
      0,
      undefined,
      false,
      {
        enemyId: surfaceEnemyId,
      },
    );

    let entered = activateDungeonWorld(game);
    const dungeonId = entered.activeDungeon!.dungeonId;
    const dungeonWorld = getDungeonWorld(entered, dungeonId);
    const dungeonEnemyId = Object.keys(dungeonWorld.enemies)[0];

    expect(dungeonEnemyId).toBeDefined();

    const surfaceBefore = {
      maxHp:
        entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!.maxHp,
      attack:
        entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!.attack,
      defense:
        entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!
          .defense,
    };
    const dungeonBefore = {
      maxHp: dungeonWorld.enemies[dungeonEnemyId!]!.maxHp,
      attack: dungeonWorld.enemies[dungeonEnemyId!]!.attack,
      defense: dungeonWorld.enemies[dungeonEnemyId!]!.defense,
    };

    for (let cycle = 0; cycle < 200; cycle += 1) {
      const candidate = { ...entered, bloodMoonCycle: cycle };
      const synced = syncBloodMoon(candidate, 18 * 60);
      if (synced.bloodMoonActive) {
        entered = synced;
        break;
      }
    }

    expect(entered.bloodMoonActive).toBe(true);
    expect(
      entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!.maxHp,
    ).toBeGreaterThan(surfaceBefore.maxHp);
    expect(
      entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!.attack,
    ).toBeGreaterThan(surfaceBefore.attack);
    expect(
      entered.worlds[entered.surfaceWorldId]!.enemies[surfaceEnemyId]!.defense,
    ).toBeGreaterThan(surfaceBefore.defense);

    const buffedDungeonWorld = getDungeonWorld(entered, dungeonId);
    expect(buffedDungeonWorld.enemies[dungeonEnemyId!]!.maxHp).toBe(
      dungeonBefore.maxHp,
    );
    expect(buffedDungeonWorld.enemies[dungeonEnemyId!]!.attack).toBe(
      dungeonBefore.attack,
    );
    expect(buffedDungeonWorld.enemies[dungeonEnemyId!]!.defense).toBe(
      dungeonBefore.defense,
    );

    const sunrise = syncBloodMoon(entered, 7 * 60);

    expect(sunrise.bloodMoonActive).toBe(false);
    expect(
      sunrise.worlds[sunrise.surfaceWorldId]!.enemies[surfaceEnemyId]!.maxHp,
    ).toBe(surfaceBefore.maxHp);
    expect(
      sunrise.worlds[sunrise.surfaceWorldId]!.enemies[surfaceEnemyId]!.attack,
    ).toBe(surfaceBefore.attack);
    expect(
      sunrise.worlds[sunrise.surfaceWorldId]!.enemies[surfaceEnemyId]!.defense,
    ).toBe(surfaceBefore.defense);

    const sunriseDungeonWorld = getDungeonWorld(sunrise, dungeonId);
    expect(sunriseDungeonWorld.enemies[dungeonEnemyId!]!.maxHp).toBe(
      dungeonBefore.maxHp,
    );
    expect(sunriseDungeonWorld.enemies[dungeonEnemyId!]!.attack).toBe(
      dungeonBefore.attack,
    );
    expect(sunriseDungeonWorld.enemies[dungeonEnemyId!]!.defense).toBe(
      dungeonBefore.defense,
    );
  });
});
