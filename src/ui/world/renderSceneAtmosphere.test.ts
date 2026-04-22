import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getCloudLayer,
  getLabelsLayer,
  getMarkerLayer,
  getWorld,
  MockGraphics,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene atmosphere', () => {
  it('renders a red fullscreen warning when player HP drops below 30%', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-low-hp-warning');
    game.player.baseMaxHp = 100;
    game.player.hp = 29;
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      600,
    );

    const scene = getSceneCache(app as never);
    const fullscreenEffectFill =
      scene.fullscreenEffectFill as unknown as MockGraphics;
    const lastBeginFillCall =
      fullscreenEffectFill.beginFill.mock.calls[
        fullscreenEffectFill.beginFill.mock.calls.length - 1
      ];

    expect(fullscreenEffectFill.visible).toBe(true);
    expect(lastBeginFillCall?.[0]).toBe(0x991b1b);
    expect(lastBeginFillCall?.[1]).toBeGreaterThan(0);
    expect(fullscreenEffectFill.drawRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('does not render the low-HP fullscreen warning at 30% HP', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-low-hp-threshold');
    game.player.baseMaxHp = 100;
    game.player.hp = 30;
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      600,
    );

    const scene = getSceneCache(app as never);
    const fullscreenEffectFill =
      scene.fullscreenEffectFill as unknown as MockGraphics;

    expect(fullscreenEffectFill.visible).toBe(false);
    expect(fullscreenEffectFill.beginFill).not.toHaveBeenCalled();
  });

  it('adds animated campfire and furnace glow only once the world gets dark', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-campfire-glow');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      structure: 'furnace',
      items: [],
      enemyIds: [],
    };

    const nightApp = createMockApp();
    renderScene(
      nightApp as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      0,
      1600,
    );

    const nightWorld = getWorld(nightApp);
    const nightGlowEllipses = collectDescendants(nightWorld).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.drawEllipse.mock.calls.length > 0,
    );
    const nightAnimatedLayer = nightWorld.children[4] as {
      children: unknown[];
    };
    const nightMarkerLayer = getMarkerLayer(nightApp);

    const dayApp = createMockApp();
    renderScene(
      dayApp as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      1600,
    );

    const dayGlowEllipses = collectDescendants(getWorld(dayApp)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.drawEllipse.mock.calls.length > 0,
    );

    expect(nightGlowEllipses.length).toBeGreaterThan(0);
    expect(nightGlowEllipses.length).toBeGreaterThanOrEqual(2);
    expect(nightGlowEllipses.length).toBeLessThanOrEqual(10);
    expect(dayGlowEllipses).toHaveLength(0);
    expect(nightAnimatedLayer.children.length).toBeGreaterThan(0);
    expect(nightMarkerLayer.children.length).toBeGreaterThan(0);
  });

  it('renders clouds with stronger opacity', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-cloud-opacity');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const cloudAlphas = getCloudLayer(app).children.map(
      (child) => (child as { alpha: number }).alpha,
    );

    expect(cloudAlphas.length).toBeGreaterThan(0);
    expect(Math.min(...cloudAlphas)).toBeGreaterThanOrEqual(0.38);
  });

  it('spreads clouds across varied heights', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-ground-cover');
    const app = createMockApp(960, 720);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      1600,
    );

    const cloudYPositions = getCloudLayer(app).children.map(
      (child) =>
        (child as { position: { set: ReturnType<typeof vi.fn> } }).position.set
          .mock.calls[0]?.[1],
    );
    const uniqueCloudYBands = new Set(
      cloudYPositions.map((value) => Math.round(value / 24)),
    );

    expect(uniqueCloudYBands.size).toBeGreaterThanOrEqual(8);
  });

  it('covers hexes beyond the reveal radius with fog of war', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(6, 'render-scene-fog-of-war');
    game.tiles['5,0'] = {
      coord: { q: 5, r: 0 },
      terrain: 'forest',
      structure: 'town',
      items: [],
      enemyIds: ['enemy-5,0-0'],
    };
    game.enemies['enemy-5,0-0'] = {
      id: 'enemy-5,0-0',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 5, r: 0 },
      tier: 9,
      hp: 10,
      maxHp: 10,
      attack: 5,
      defense: 2,
      xp: 12,
      elite: false,
    };
    const app = createMockApp(960, 720);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const fogPolygons = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x020617 && alpha === 0.78,
        ),
    );
    const labels = getLabelsLayer(app);

    expect(fogPolygons.length).toBeGreaterThan(0);
    expect(
      labels.children.some(
        (child) => child instanceof MockText && child.text === 'L9',
      ),
    ).toBe(false);
  });
});
