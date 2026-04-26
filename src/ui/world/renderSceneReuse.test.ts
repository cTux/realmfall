import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  countDrawnPolygons,
  createMockApp,
  getWorld,
  setupRenderSceneTestEnvironment,
  textureFrom,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe.skip('renderScene reuse', () => {
  it('reuses persistent stage layers and sprite instances across renders', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-reuse');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      400,
    );

    const initialStageChildren = [...app.stage.children];
    const initialSpriteCalls = textureFrom.mock.calls.length;

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 1, r: 0 },
      12 * 60,
      800,
    );

    expect(app.stage.children).toEqual(initialStageChildren);
    expect(textureFrom.mock.calls).toHaveLength(initialSpriteCalls);
  });

  it('caches deterministic cloud and terrain presentation inputs', async () => {
    const randomModule = await import('../../game/random');
    const createRngSpy = vi.spyOn(randomModule, 'createRng');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-deterministic-cache');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    createRngSpy.mockClear();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      400,
    );

    expect(createRngSpy).toHaveBeenCalled();

    createRngSpy.mockClear();

    renderScene(
      app as never,
      { ...game, turn: game.turn + 1 },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      800,
    );

    const rerenderSeeds = createRngSpy.mock.calls.map(([seed]) => seed);

    expect(rerenderSeeds.some((seed) => seed.includes('-cloud-'))).toBe(false);
    expect(
      rerenderSeeds.some((seed) => seed.includes('-terrain-background-')),
    ).toBe(false);
  });

  it('keeps static world polygons cached across animation-only frames', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-static-cache');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
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
      game.player.coord,
      null,
      0,
      1800,
    );

    expect(countDrawnPolygons(world)).toBe(initialPolygonCalls);
  });

  it('skips enemy lookups on pure animation-only frames once static layers are cached', async () => {
    const stateModule = await import('../../game/stateSelectors');
    const getEnemiesAtSpy = vi.spyOn(stateModule, 'getEnemiesAt');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-animation-only-skip');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    getEnemiesAtSpy.mockClear();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1200,
    );

    const initialEnemyLookupCount = getEnemiesAtSpy.mock.calls.length;

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1800,
    );

    expect(getEnemiesAtSpy).toHaveBeenCalledTimes(initialEnemyLookupCount);
  });

  it('looks up visible tile enemies once for static token and marker rendering', async () => {
    const stateModule = await import('../../game/stateSelectors');
    const getEnemiesAtSpy = vi.spyOn(stateModule, 'getEnemiesAt');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-visible-input-cache');
    const visibleTiles = getVisibleTiles(game);
    const app = createMockApp();

    getEnemiesAtSpy.mockClear();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1200,
    );

    expect(getEnemiesAtSpy).toHaveBeenCalledTimes(visibleTiles.length);
  });
});
