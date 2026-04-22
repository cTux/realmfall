import { createGame, getVisibleTiles } from '../../game/state';
import {
  countDrawnPolygons,
  createMockApp,
  getCloudLayer,
  getWorld,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene cache invalidation', () => {
  it('keeps static and stable interaction layers cached across time-only frames', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-time-cache');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      0,
      1200,
    );

    const world = getWorld(app);
    const initialPolygonCalls = countDrawnPolygons(world);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      1800,
    );

    expect(countDrawnPolygons(world)).toBe(initialPolygonCalls);
  });

  it('keeps animated layers cached across interaction-only frames in the same bucket', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-animated-bucket-cache');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      100,
    );

    const scene = getSceneCache(app as never);
    const initialSkyClearCalls = (scene.skyFill as unknown as MockGraphics)
      .clear.mock.calls.length;
    const initialOverlayClearCalls = (
      scene.overlayFill as unknown as MockGraphics
    ).clear.mock.calls.length;
    const initialCloudCount = getCloudLayer(app).children.length;

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      { q: 1, r: 0 },
      12 * 60,
      120,
    );

    expect(
      (scene.skyFill as unknown as MockGraphics).clear.mock.calls,
    ).toHaveLength(initialSkyClearCalls);
    expect(
      (scene.overlayFill as unknown as MockGraphics).clear.mock.calls,
    ).toHaveLength(initialOverlayClearCalls);
    expect(getCloudLayer(app).children).toHaveLength(initialCloudCount);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      180,
    );

    expect(
      (scene.skyFill as unknown as MockGraphics).clear.mock.calls.length,
    ).toBeGreaterThan(initialSkyClearCalls);
    expect(
      (scene.overlayFill as unknown as MockGraphics).clear.mock.calls.length,
    ).toBeGreaterThan(initialOverlayClearCalls);
  });

  it('keeps static and stable interaction layers cached across log-only state clones', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-log-cache');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      { q: 1, r: 0 },
      null,
      12 * 60,
      1200,
    );

    const world = getWorld(app);
    const initialPolygonCalls = countDrawnPolygons(world);
    const logOnlyGame = {
      ...game,
      logs: [
        ...game.logs,
        {
          id: 'log-4',
          kind: 'system' as const,
          text: 'A quiet wind rolls over the valley.',
          turn: game.turn,
        },
      ],
    };

    renderScene(
      app as never,
      logOnlyGame,
      getVisibleTiles(logOnlyGame),
      { q: 1, r: 0 },
      null,
      12 * 60,
      1800,
    );

    expect(countDrawnPolygons(world)).toBe(initialPolygonCalls);
  });

  it('keeps static and stable interaction layers cached across offscreen enemy-only clones', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-offscreen-enemy-cache');
    game.homeHex = { q: 1, r: 0 };
    const visibleTiles = getVisibleTiles(game);
    const offscreenCoord = { q: 5, r: 0 };
    game.tiles['5,0'] = {
      coord: offscreenCoord,
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-5,0-0'],
    };
    game.enemies['enemy-5,0-0'] = {
      id: 'enemy-5,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: offscreenCoord,
      tier: 1,
      hp: 2,
      maxHp: 2,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      1200,
    );

    const world = getWorld(app);
    const initialPolygonCalls = countDrawnPolygons(world);
    const offscreenEnemyClone = {
      ...game,
      enemies: {
        ...game.enemies,
        'enemy-5,0-0': {
          ...game.enemies['enemy-5,0-0'],
          hp: 1,
        },
      },
    };

    renderScene(
      app as never,
      offscreenEnemyClone,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      1800,
    );

    const sceneCache = getSceneCache(app as never);

    expect(countDrawnPolygons(world)).toBe(initialPolygonCalls);
    expect(sceneCache.derivedRenderEnemiesSource).toBe(
      offscreenEnemyClone.enemies,
    );
  });
});
