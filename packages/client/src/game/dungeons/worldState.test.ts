import { describe, expect, it } from 'vitest';
import { createGame } from '../stateFactory';
import {
  createDungeonWorldState,
  getActiveWorld,
  setActiveWorld,
  syncActiveWorldAliases,
  SURFACE_WORLD_ID,
} from './worldState';

describe('worldState', () => {
  it('keeps top-level tiles and enemies aliased to the active world only', () => {
    const game = createGame(3, 'dungeon-world-alias');
    const dungeonId = 'dungeon:dungeon-world-alias:1,0';
    const dungeonWorld = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-brick-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 4, r: 0 },
        finalEliteEnemyId: 'enemy-4,0-0',
        paddingRadius: 6,
        surfaceEntranceCoord: { q: 1, r: 0 },
        templateId: 'rooms-and-corridors',
        themeId: 'brick-halls',
      },
    });

    game.worlds[dungeonId] = dungeonWorld;
    setActiveWorld(game, dungeonId);

    expect(getActiveWorld(game).id).toBe(dungeonId);
    expect(game.tiles['0,0']?.terrain).toBe('dungeon-brick-floor');
    expect(game.worlds[SURFACE_WORLD_ID]?.tiles['0,0']?.terrain).toBe('plains');
  });

  it('hydrates active-world aliases after restoring a dungeon-backed game', () => {
    const game = createGame(3, 'dungeon-world-restore');
    const dungeonId = 'dungeon:dungeon-world-restore:2,-1';
    game.activeWorldId = dungeonId;
    game.worlds[dungeonId] = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-mud-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 6, r: -1 },
        finalEliteEnemyId: 'enemy-6,-1-0',
        paddingRadius: 6,
        surfaceEntranceCoord: { q: 2, r: -1 },
        templateId: 'branching-spine',
        themeId: 'mud-catacombs',
      },
    });

    syncActiveWorldAliases(game);

    expect(game.tiles['0,0']?.terrain).toBe('dungeon-mud-floor');
    expect(game.enemies).toBe(game.worlds[dungeonId]?.enemies);
  });
});
