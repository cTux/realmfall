import { describe, expect, it } from 'vitest';
import { createGame } from '../stateFactory';
import type { Enemy, Tile } from '../types';
import {
  createSurfaceWorldAliasState,
  createDungeonWorldState,
  getActiveWorld,
  replaceWorldCollections,
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

  it('can build a surface-world alias view without mutating dungeon aliases', () => {
    const game = createGame(3, 'surface-world-alias-view');
    const dungeonId = 'dungeon:surface-world-alias-view:1,0';
    game.worlds[dungeonId] = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-obsidian-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 4, r: 1 },
        finalEliteEnemyId: 'enemy-4,1-0',
        paddingRadius: 6,
        surfaceEntranceCoord: { q: 1, r: 0 },
        templateId: 'rooms-and-corridors',
        themeId: 'obsidian-vault',
      },
    });

    setActiveWorld(game, dungeonId);

    const surfaceAliases = createSurfaceWorldAliasState(game);

    expect(surfaceAliases.activeWorldId).toBe(game.surfaceWorldId);
    expect(surfaceAliases.tiles['0,0']?.terrain).toBe('plains');
    expect(game.activeWorldId).toBe(dungeonId);
    expect(game.tiles['0,0']?.terrain).toBe('dungeon-obsidian-floor');
  });

  it('replaces a world tile and enemy map while keeping root aliases synchronized', () => {
    const game = createGame(3, 'replace-world-collections');
    const replacementTiles: Record<string, Tile> = {
      '1,0': {
        coord: { q: 1, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: ['enemy-1,0-0'],
      },
    };
    const replacementEnemies: Record<string, Enemy> = {
      'enemy-1,0-0': {
        id: 'enemy-1,0-0',
        name: 'Wolf',
        coord: { q: 1, r: 0 },
        tier: 1,
        hp: 5,
        maxHp: 5,
        attack: 2,
        defense: 1,
        xp: 3,
        elite: false,
      },
    };

    const next = replaceWorldCollections(game, game.surfaceWorldId, {
      tiles: replacementTiles,
      enemies: replacementEnemies,
    });

    expect(next.worlds[game.surfaceWorldId]?.tiles).toBe(replacementTiles);
    expect(next.worlds[game.surfaceWorldId]?.enemies).toBe(replacementEnemies);
    expect(next.tiles).toBe(replacementTiles);
    expect(next.enemies).toBe(replacementEnemies);
  });
});
