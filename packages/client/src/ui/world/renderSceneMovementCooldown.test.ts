import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getPlayerLayer,
  MockGraphics,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';
import { getWorldHexSize } from './renderSceneMath';

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

  it('draws a yellow cooldown bar along the south-east edge of the current hex while movement cooldown remains active', async () => {
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

    const angledBar = cooldownGraphics.find(
      (graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ) && graphic.drawPolygon.mock.calls.length > 0,
    );
    const borderBar = cooldownGraphics.find(
      (graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x422006 && alpha === 0.85,
        ) && graphic.drawPolygon.mock.calls.length > 0,
    );

    expect(angledBar).toBeDefined();
    expect(borderBar).toBeDefined();

    const [points] = angledBar!.drawPolygon.mock.calls[0]!;
    const [borderPoints] = borderBar!.drawPolygon.mock.calls[0]!;
    expect(points).toHaveLength(8);
    expect(borderPoints).toHaveLength(8);

    const [x1, y1, x2, y2, x3, y3, x4, y4] = points;
    const [borderX1, borderY1, borderX2, borderY2] = borderPoints;
    const hexOriginX = app.screen.width / 2;
    const hexOriginY = app.screen.height / 2;
    const centroidX = (x1 + x2 + x3 + x4) / 4;
    const centroidY = (y1 + y2 + y3 + y4) / 4;
    const edgeSlope = (y2 - y1) / (x2 - x1);
    const expectedEdgeSlope = -1 / Math.sqrt(3);
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const expectedThickness = Math.max(3, hexSize * 1.58 * 0.075);
    const borderStart = {
      x: hexOriginX + Math.cos(Math.PI / 6) * hexSize,
      y: hexOriginY + Math.sin(Math.PI / 6) * hexSize,
    };
    const borderEnd = {
      x: hexOriginX + Math.cos(Math.PI / 2) * hexSize,
      y: hexOriginY + Math.sin(Math.PI / 2) * hexSize,
    };
    const borderVector = {
      x: borderEnd.x - borderStart.x,
      y: borderEnd.y - borderStart.y,
    };
    const borderLength = Math.hypot(borderVector.x, borderVector.y) || 1;
    const distanceToBorder = (x: number, y: number) =>
      Math.abs(
        borderVector.y * x -
          borderVector.x * y +
          borderEnd.x * borderStart.y -
          borderEnd.y * borderStart.x,
      ) / borderLength;

    expect(centroidX).toBeGreaterThan(hexOriginX + hexSize * 0.2);
    expect(centroidY).toBeGreaterThan(hexOriginY + hexSize * 0.2);
    expect(edgeSlope).toBeCloseTo(expectedEdgeSlope, 4);
    expect(borderX1).toBeCloseTo(borderStart.x, 4);
    expect(borderY1).toBeCloseTo(borderStart.y, 4);
    expect(borderX2).toBeCloseTo(borderEnd.x, 4);
    expect(borderY2).toBeCloseTo(borderEnd.y, 4);
    expect(distanceToBorder(x1, y1)).toBeCloseTo(0, 4);
    expect(distanceToBorder(x2, y2)).toBeCloseTo(0, 4);
    expect(distanceToBorder(x3, y3)).toBeCloseTo(expectedThickness, 4);
    expect(distanceToBorder(x4, y4)).toBeCloseTo(expectedThickness, 4);
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
