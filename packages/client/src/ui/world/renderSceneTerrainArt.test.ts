import { createGame } from '../../game/stateFactory';
import {
  createMockApp,
  getWorldGroundLayer,
  MockContainer,
  MockGraphics,
  MockSprite,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestkit';

setupRenderSceneTestEnvironment();

describe('renderScene terrain art', () => {
  it('keeps dungeon terrain art on the standard sprite path', async () => {
    const { renderScene } = await import('./renderScene');
    const { createDungeonWorldState, setActiveWorld } =
      await import('../../game/dungeons/worldState');

    const game = createGame(2, 'render-scene-dungeon-terrain-mask');
    const dungeonId = 'dungeon:render-scene-dungeon-terrain-mask:1,0';
    game.worlds[dungeonId] = createDungeonWorldState({
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
        finalChestCoord: { q: 1, r: 0 },
        finalEliteEnemyId: 'elite-test',
        paddingRadius: 4,
        surfaceEntranceCoord: { q: 1, r: 0 },
        templateId: 'rooms-and-corridors',
        themeId: 'brick-halls',
      },
    });
    setActiveWorld(game, dungeonId);
    game.player.coord = { q: 0, r: 0 };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      [game.tiles['0,0']!],
      game.player.coord,
      null,
      12 * 60,
      100,
    );

    const worldGround = getWorldGroundLayer(app);
    const terrainLayer = worldGround.children[1] as MockContainer;
    const terrainSprite = terrainLayer.children[0] as MockSprite;

    expect(terrainSprite.visible).toBe(true);
    expect(terrainLayer.children[0]).not.toBeInstanceOf(MockContainer);
  });

  it('keeps non-dungeon terrain art on the standard sprite path', async () => {
    const { renderScene } = await import('./renderScene');

    const game = createGame(2, 'render-scene-surface-terrain-art');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      [game.tiles['0,0']!],
      game.player.coord,
      null,
      12 * 60,
      100,
    );

    const worldGround = getWorldGroundLayer(app);
    const terrainLayer = worldGround.children[1] as MockContainer;
    const terrainSprite = terrainLayer.children[0] as MockSprite;

    expect(terrainSprite.visible).toBe(true);
    expect(terrainLayer.children[0]).not.toBeInstanceOf(MockContainer);
  });

  it('uses distinct background tints for dungeon floors and walls', async () => {
    const { renderScene } = await import('./renderScene');
    const { createDungeonWorldState, setActiveWorld } =
      await import('../../game/dungeons/worldState');

    const game = createGame(2, 'render-scene-dungeon-wall-style');
    const dungeonId = 'dungeon:render-scene-dungeon-wall-style:1,0';
    game.worlds[dungeonId] = createDungeonWorldState({
      id: dungeonId,
      tiles: {
        '0,0': {
          coord: { q: 0, r: 0 },
          terrain: 'dungeon-brick-floor',
          structure: 'dungeon',
          items: [],
          enemyIds: [],
        },
        '1,0': {
          coord: { q: 1, r: 0 },
          terrain: 'dungeon-brick-wall',
          items: [],
          enemyIds: [],
        },
      },
      enemies: {},
      dungeon: {
        cleared: false,
        entranceCoord: { q: 0, r: 0 },
        finalChestCoord: { q: 1, r: 1 },
        finalEliteEnemyId: 'elite-test',
        paddingRadius: 4,
        surfaceEntranceCoord: { q: 1, r: 0 },
        templateId: 'rooms-and-corridors',
        themeId: 'brick-halls',
      },
    });
    setActiveWorld(game, dungeonId);
    game.player.coord = { q: 0, r: 0 };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      [game.tiles['0,0']!, game.tiles['1,0']!],
      game.player.coord,
      null,
      12 * 60,
      100,
    );

    const worldGround = getWorldGroundLayer(app);
    const fillLayer = worldGround.children[0] as MockContainer;
    const floorFill = fillLayer.children[0] as MockGraphics;
    const wallFill = fillLayer.children[1] as MockGraphics;

    expect(floorFill.beginFill.mock.calls[0]?.[0]).toBe(0x334155);
    expect(floorFill.beginFill.mock.calls[0]?.[1]).toBe(0.82);
    expect(wallFill.beginFill.mock.calls[0]?.[0]).toBe(0x020617);
    expect(wallFill.beginFill.mock.calls[0]?.[1]).toBe(0.98);
  });
});
