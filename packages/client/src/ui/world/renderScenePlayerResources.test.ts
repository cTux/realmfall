import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getPlayerLayer,
  MockGraphics,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

const PLAYER_BACKGROUND_COLOR = 0x22d3ee;
const PLAYER_HEALTH_TRACK_COLOR = 0x7f1d1d;
const PLAYER_HEALTH_FILL_COLOR = 0xff2d55;
const PLAYER_MANA_TRACK_COLOR = 0x1e40af;
const PLAYER_MANA_FILL_COLOR = 0x38bdf8;

describe('renderScene player resource bars', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class MockOffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the player inside a cyan circular badge with top HP, bottom MP, and a level plate', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-resources');
    const app = createMockApp();
    game.player.baseMaxHp = 100;
    game.player.hp = 50;
    game.player.baseMaxMana = 20;
    game.player.mana = 5;

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      250,
    );

    const playerLayerEntries = collectDescendants(getPlayerLayer(app));
    const resourceGraphics = playerLayerEntries.filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const playerTexts = playerLayerEntries.filter(
      (child): child is MockText => child instanceof MockText && child.visible,
    );

    expect(
      resourceGraphics.some(
        (graphic) =>
          graphic.drawEllipse.mock.calls.length > 0 &&
          graphic.beginFill.mock.calls.some(
            ([fillColor]) => fillColor === PLAYER_BACKGROUND_COLOR,
          ),
      ),
    ).toBe(true);
    expect(
      playerTexts.some(
        (child) =>
          child.text === game.player.level.toString() && child.position.y < 0,
      ),
    ).toBe(true);
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_HEALTH_TRACK_COLOR, 'top'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_HEALTH_FILL_COLOR, 'top'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_TRACK_COLOR, 'bottom'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_FILL_COLOR, 'bottom'),
    ).toBeDefined();
  });

  it('keeps the top and bottom resource tracks visible when the player resource values are empty', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-empty-resource-track');
    const app = createMockApp();
    game.player.baseMaxHp = 100;
    game.player.hp = 0;
    game.player.baseMaxMana = 20;
    game.player.mana = 0;

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      250,
    );

    const resourceGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_HEALTH_TRACK_COLOR, 'top'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_TRACK_COLOR, 'bottom'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_HEALTH_FILL_COLOR, 'top'),
    ).toBeUndefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_FILL_COLOR, 'bottom'),
    ).toBeUndefined();
  });

  it('rerenders the player resource layer when hp or mana changes inside the same render bucket', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-player-resource-invalidation');
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
    const initialInteractionCount = scene.renderCounts.interaction;
    const changedGame = {
      ...game,
      player: {
        ...game.player,
        hp: Math.max(1, game.player.hp - 3),
        mana: Math.max(0, game.player.mana - 2),
      },
    };

    renderScene(
      app as never,
      changedGame,
      visibleTiles,
      changedGame.player.coord,
      null,
      12 * 60,
      110,
    );

    expect(scene.renderCounts.interaction).toBe(initialInteractionCount + 1);
  });

  it('rerenders the player marker layer when the player level changes inside the same render bucket', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-player-level-invalidation');
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
    const initialInteractionCount = scene.renderCounts.interaction;

    renderScene(
      app as never,
      {
        ...game,
        player: {
          ...game.player,
          level: game.player.level + 1,
        },
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      110,
    );

    expect(scene.renderCounts.interaction).toBe(initialInteractionCount + 1);
  });
});

function findHemisphereArc(
  graphics: MockGraphics[],
  color: number,
  hemisphere: 'bottom' | 'top',
) {
  return graphics.find((graphic) => {
    if (
      !graphic.beginFill.mock.calls.some(([fillColor]) => fillColor === color)
    ) {
      return false;
    }

    if (graphic.drawPolygon.mock.calls.length === 0) {
      return false;
    }

    return graphic.drawPolygon.mock.calls.some(([points]) => {
      const numericPoints = points as number[];
      expect(numericPoints.length).toBeGreaterThan(8);
      const averageY =
        numericPoints.reduce(
          (sum, value, index) => sum + (index % 2 === 1 ? value : 0),
          0,
        ) /
        (numericPoints.length / 2);

      return hemisphere === 'top' ? averageY < 0 : averageY > 0;
    });
  });
}
