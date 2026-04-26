import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  countDrawnPolygons,
  createMockApp,
  getCloudLayer,
  getWorld,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe.skip('renderScene cache invalidation', () => {
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
      101,
    );

    const scene = getSceneCache(app as never);
    const initialSkyClearCalls = (scene.skyFill as unknown as MockGraphics)
      .clear.mock.calls.length;
    const initialOverlayClearCalls = (
      scene.overlayFill as unknown as MockGraphics
    ).clear.mock.calls.length;
    const initialFullscreenEffectClearCalls = (
      scene.fullscreenEffectFill as unknown as MockGraphics
    ).clear.mock.calls.length;
    const initialCloudCount = getCloudLayer(app).children.length;

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      { q: 1, r: 0 },
      12 * 60,
      110,
    );

    expect(
      (scene.skyFill as unknown as MockGraphics).clear.mock.calls,
    ).toHaveLength(initialSkyClearCalls);
    expect(
      (scene.overlayFill as unknown as MockGraphics).clear.mock.calls,
    ).toHaveLength(initialOverlayClearCalls);
    expect(
      (scene.fullscreenEffectFill as unknown as MockGraphics).clear.mock.calls,
    ).toHaveLength(initialFullscreenEffectClearCalls);
    expect(getCloudLayer(app).children).toHaveLength(initialCloudCount);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      121,
    );

    expect(
      (scene.skyFill as unknown as MockGraphics).clear.mock.calls.length,
    ).toBeGreaterThan(initialSkyClearCalls);
    expect(
      (scene.overlayFill as unknown as MockGraphics).clear.mock.calls.length,
    ).toBeGreaterThan(initialOverlayClearCalls);
    expect(
      (scene.fullscreenEffectFill as unknown as MockGraphics).clear.mock.calls
        .length,
    ).toBeGreaterThan(initialFullscreenEffectClearCalls);
  });

  it('tracks render-pass counts for static-layer profiling', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneRenderCounts } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-profiling-counters');
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      101,
    );

    expect(getSceneRenderCounts(app as never)).toEqual({
      animated: 1,
      interaction: 1,
      static: 1,
      total: 1,
    });

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      110,
    );

    expect(getSceneRenderCounts(app as never)).toEqual({
      animated: 1,
      interaction: 1,
      static: 1,
      total: 2,
    });

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      { q: 1, r: 0 },
      12 * 60,
      115,
    );

    expect(getSceneRenderCounts(app as never)).toEqual({
      animated: 1,
      interaction: 2,
      static: 1,
      total: 3,
    });
  });

  it('rerenders animated overlays when the low-HP warning toggles inside the same bucket', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-low-hp-invalidation');
    game.player.baseMaxHp = 100;
    game.player.hp = 100;
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      101,
    );

    const scene = getSceneCache(app as never);
    const fullscreenEffectFill =
      scene.fullscreenEffectFill as unknown as MockGraphics;
    const initialClearCalls = fullscreenEffectFill.clear.mock.calls.length;
    const lowHpGame = {
      ...game,
      player: {
        ...game.player,
        hp: 29,
      },
    };

    renderScene(
      app as never,
      lowHpGame,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      110,
    );

    const lastBeginFillCall =
      fullscreenEffectFill.beginFill.mock.calls[
        fullscreenEffectFill.beginFill.mock.calls.length - 1
      ];

    expect(fullscreenEffectFill.clear.mock.calls.length).toBeGreaterThan(
      initialClearCalls,
    );
    expect(lastBeginFillCall?.[0]).toBe(0x991b1b);
    expect(lastBeginFillCall?.[1]).toBeGreaterThan(0);
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
