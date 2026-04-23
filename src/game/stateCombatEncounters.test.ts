import {
  createGame,
  forfeitCombat,
  getEnemiesAt,
  getPlayerCombatStats,
  getTileAt,
  moveToTile,
  progressCombat,
  startCombat,
} from './state';
import { Skill } from './types';
import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';

describe('game state combat encounters', () => {
  it('opens and resolves combat encounters on enemy tiles', () => {
    const game = createCombatEncounterGame('combat-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });

    const encountered = moveToTile(game, target);
    expect(encountered.combat).not.toBeNull();

    const resolved = startCombat(encountered);
    expect(resolved.combat).toBeNull();
    expect(getEnemiesAt(resolved, target)).toHaveLength(0);
    expect(
      getTileAt(resolved, target).items.every((item) =>
        ['Gold', 'Leather Scraps', 'Meat'].includes(item.name),
      ),
    ).toBe(true);
  });

  it('creates an encounter that waits for Start before battle begins', () => {
    const game = createCombatEncounterGame('combat-start-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 5,
      maxHp: 5,
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    });

    const encountered = moveToTile(game, target);
    expect(encountered.combat?.started).toBe(false);
    expect(progressCombat(encountered)).toBe(encountered);
    expect(encountered.enemies['enemy-2,0-0']?.hp).toBe(5);
    expect(
      encountered.logs.some((entry) =>
        /press start to begin the battle/i.test(entry.text),
      ),
    ).toBe(true);
  });

  it('lets the player forfeit a battle after combat has started', () => {
    const game = createCombatEncounterGame('combat-forfeit-seed');
    const target = seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 2,
      defense: 0,
      xp: 5,
      elite: false,
    });
    game.homeHex = { q: 0, r: 0 };
    game.worldTimeMs = 75_000;

    const encountered = moveToTile(game, target);
    const started = startCombat(encountered);

    expect(started.combat?.startedAtMs).toBe(75_000);

    const forfeited = forfeitCombat(started);

    expect(forfeited.combat).toBeNull();
    expect(forfeited.player.coord).toEqual({ q: 0, r: 0 });
    expect(forfeited.player.hp).toBe(1);
    expect(
      forfeited.logs.some((entry) => /you were defeated/i.test(entry.text)),
    ).toBe(true);
  });

  it('automatically skins animal enemies on kill', () => {
    const game = createCombatEncounterGame('skinning-seed');
    const target = seedCombatEncounter(
      game,
      {
        id: 'enemy-2,0-0',
        enemyTypeId: 'wolf',
        name: 'Wolf',
        tier: 2,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 5,
        elite: false,
      },
      { terrain: 'forest' },
    );

    const encountered = moveToTile(game, target);
    const resolved = startCombat(encountered);

    expect(
      getTileAt(resolved, target).items.some(
        (item) => item.name === 'Leather Scraps',
      ),
    ).toBe(true);
    expect(
      getTileAt(resolved, target).items.some((item) => item.name === 'Meat'),
    ).toBe(true);
    expect(resolved.player.skills[Skill.Skinning].xp).toBeGreaterThan(0);
  });

  it('lets every enemy on the tile retaliate during combat', () => {
    const game = createGame(3, 'group-combat-seed');
    const target = { q: 2, r: 0 };
    game.tiles['2,0'] = {
      coord: target,
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: ['enemy-2,0-0', 'enemy-2,0-1'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 40,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-2,0-1'] = {
      id: 'enemy-2,0-1',
      name: 'Wolf',
      coord: target,
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 41,
      defense: 0,
      xp: 5,
      elite: false,
    };
    game.player.coord = { q: 1, r: 0 };

    const encountered = moveToTile(game, target);
    const resolvedRound = startCombat(encountered);

    expect(resolvedRound.combat?.enemyIds).toHaveLength(2);
    expect(
      resolvedRound.logs.filter((entry) =>
        /the wolf .*hits you/i.test(entry.text),
      ),
    ).toHaveLength(2);
    expect(resolvedRound.player.hp).toBeLessThan(
      getPlayerCombatStats(resolvedRound.player).maxHp,
    );
  });
});
