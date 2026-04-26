import {
  createGame,
  getRecipeBookRecipes,
  getSafePathToTile,
  getTileAt,
  getVisibleTiles,
  moveAlongSafePath,
  moveToTile,
} from './state';
import {
  GAME_DAY_DURATION_MS,
  GAME_DAY_MINUTES,
  GAME_CONFIG,
  WORLD_NIGHT_AMBUSH_CHANCE,
  WORLD_REVEAL_RADIUS,
} from './config';
import { EnemyTypeId } from './content/ids';
import {
  findEnemy,
  findFactionNpcTile,
  findFactionTownTile,
} from './stateTestHelpers';

describe.skip('game state exploration', () => {
  it('creates a centered start in a visible hex viewport', () => {
    const game = createGame(3, 'test-seed');
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
    expect(getTileAt(game, { q: 0, r: 0 }).terrain).toBe('plains');
    expect(getTileAt(game, { q: 0, r: 0 }).structure).toBeUndefined();
    expect(getTileAt(game, { q: 0, r: 0 }).enemyIds).toEqual([]);
    expect(getVisibleTiles(game)).toHaveLength(37);
    expect(game.player.learnedRecipeIds).toEqual(['cook-cooked-fish']);
    expect(getRecipeBookRecipes(game.player.learnedRecipeIds)).toHaveLength(1);
  });

  it('generates deterministic distant tiles for an infinite world', () => {
    const gameA = createGame(3, 'far-seed');
    const gameB = createGame(3, 'far-seed');
    const farCoord = { q: 30, r: -12 };

    expect(getTileAt(gameA, farCoord)).toEqual(getTileAt(gameB, farCoord));
  });

  it('scales enemy level with distance from the origin', () => {
    const game = createGame(3, 'far-seed');
    const near = findEnemy(game, 2, 8);
    const far = findEnemy(game, 28, 36);

    expect(near).toBeDefined();
    expect(far).toBeDefined();
    expect((far?.tier ?? 0) > (near?.tier ?? 0)).toBe(true);
  });

  it('moves onto generated adjacent tiles beyond the starting cache', () => {
    const game = createGame(3, 'loot-seed');
    game.worldTimeMs =
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
    expect(next.player.coord).toEqual(target);
    expect(next.turn).toBe(1);
    expect(next.logs[0]?.text).toMatch(/^\[Year 1, Day 1, 18:33\] /);
  });

  it('generates faction territories with borders, neutral residents, and safe interiors', () => {
    const game = createGame(6, 'faction-territory-seed');
    const factionNpcTile = findFactionNpcTile(game, 36);
    const factionTownTile = findFactionTownTile(game, 36);

    expect(factionNpcTile).toBeDefined();
    expect(factionTownTile).toBeDefined();
    expect(factionTownTile?.claim?.ownerType).toBe('faction');
    expect(factionTownTile?.structure).toBe('town');
    expect(factionNpcTile?.claim?.ownerType).toBe('faction');
    expect(factionNpcTile?.claim?.npc).toBeDefined();
    expect(factionNpcTile?.enemyIds).toEqual([
      factionNpcTile?.claim?.npc?.enemyId,
    ]);
    expect(factionNpcTile?.structure).toBeUndefined();
  });

  it('finds a safe path around blocked and hostile hexes', () => {
    const game = createGame(4, 'safe-path-seed');

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-0,1-0'],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    expect(getSafePathToTile(game, { q: 2, r: 0 })).toEqual([
      { q: 1, r: -1 },
      { q: 2, r: -1 },
      { q: 2, r: 0 },
    ]);
  });

  it('moves across each step of a safe path', () => {
    const game = createGame(4, 'safe-path-move-seed');
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    const moved = moveAlongSafePath(game, { q: 2, r: 0 });

    expect(moved.player.coord).toEqual({ q: 2, r: 0 });
    expect(moved.turn).toBe(3);
    expect(
      moved.logs.filter((entry) => entry.kind === 'movement'),
    ).toHaveLength(3);
  });

  it('finds a safe path to a distant hostile target without crossing hostile tiles', () => {
    const game = createGame(4, 'safe-path-hostile-target-seed');

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Bandit',
      coord: { q: 2, r: 0 },
      tier: 2,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(getSafePathToTile(game, { q: 2, r: 0 })).toEqual([
      { q: 1, r: -1 },
      { q: 2, r: -1 },
      { q: 2, r: 0 },
    ]);
  });

  it('can follow a safe path into a distant hostile target and start combat there', () => {
    const game = createGame(4, 'safe-path-hostile-combat-seed');
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 3,
      maxHp: 3,
      attack: 1,
      defense: 0,
      xp: 2,
      elite: false,
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      name: 'Bandit',
      coord: { q: 2, r: 0 },
      tier: 2,
      hp: 4,
      maxHp: 4,
      attack: 2,
      defense: 1,
      xp: 5,
      elite: false,
    };

    const moved = moveAlongSafePath(game, { q: 2, r: 0 });

    expect(moved.player.coord).toEqual({ q: 2, r: 0 });
    expect(moved.turn).toBe(3);
    expect(moved.combat?.coord).toEqual({ q: 2, r: 0 });
    expect(moved.combat?.enemyIds).toEqual(['enemy-2,0-0']);
  });

  it('can ambush at night when moving onto an empty tile', () => {
    const previousChance = WORLD_NIGHT_AMBUSH_CHANCE;
    GAME_CONFIG.worldGeneration.ambush.chance = 1;

    const game = createGame(4, 'night-ambush-seed');
    game.dayPhase = 'night';
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };

    try {
      const moved = moveToTile(game, { q: 1, r: 0 });

      expect(moved.combat?.enemyIds).toHaveLength(1);
      const ambushEnemyId = moved.combat?.enemyIds[0];
      expect(moved.enemies[ambushEnemyId ?? '']?.enemyTypeId).toBe(
        EnemyTypeId.Raider,
      );
      expect(moved.enemies[ambushEnemyId ?? '']?.rarity).toBe('common');
      expect(
        moved.logs.some(
          (entry) => entry.kind === 'combat' && entry.text.includes('Ambush!'),
        ),
      ).toBe(true);
    } finally {
      GAME_CONFIG.worldGeneration.ambush.chance = previousChance;
    }
  });

  it('does not ambush during day movement', () => {
    const previousChance = WORLD_NIGHT_AMBUSH_CHANCE;
    GAME_CONFIG.worldGeneration.ambush.chance = 1;

    const game = createGame(4, 'day-no-ambush-seed');
    game.dayPhase = 'day';
    game.player.hunger = 100;
    game.player.thirst = 100;

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: undefined,
      enemyIds: [],
    };

    try {
      const moved = moveToTile(game, { q: 1, r: 0 });
      expect(moved.combat).toBeNull();
      expect(moved.player.coord).toEqual({ q: 1, r: 0 });
    } finally {
      GAME_CONFIG.worldGeneration.ambush.chance = previousChance;
    }
  });

  it('does not find a safe path into fogged hexes beyond the reveal radius', () => {
    const game = createGame(WORLD_REVEAL_RADIUS + 2, 'fogged-safe-path-seed');

    expect(
      getSafePathToTile(game, { q: WORLD_REVEAL_RADIUS + 1, r: 0 }),
    ).toBeNull();
  });

  it('does not route around obstacles through fogged hexes', () => {
    const game = createGame(WORLD_REVEAL_RADIUS + 2, 'fog-detour-path-seed');
    const edge = WORLD_REVEAL_RADIUS;
    const target = { q: edge, r: 0 };

    game.tiles[`${edge - 1},0`] = {
      coord: { q: edge - 1, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge - 1},1`] = {
      coord: { q: edge - 1, r: 1 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge},-1`] = {
      coord: { q: edge, r: -1 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    game.tiles[`${edge},0`] = {
      coord: target,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    expect(getSafePathToTile(game, target)).toBeNull();
  });
});
