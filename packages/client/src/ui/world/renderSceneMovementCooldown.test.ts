import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getPlayerLayer,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene movement cooldown', () => {
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

  it('draws a yellow cooldown bar under the player while movement cooldown remains active', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-cooldown');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 250,
        },
      } as never,
    );

    const cooldownGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      cooldownGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ),
      ),
    ).toBe(true);
  });

  it('hides the cooldown bar once the wall-clock deadline has passed', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-cooldown-expired');
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 250,
        },
      } as never,
    );

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 1_000,
        },
      } as never,
    );

    const cooldownGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      cooldownGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(([color]) => color === 0xfacc15),
      ),
    ).toBe(false);
  });
});
