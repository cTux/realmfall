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

const PLAYER_BAR_TRACK_ALPHA = 0.4;
const PLAYER_HEALTH_BAR_COLOR = 0xdc2626;
const PLAYER_MANA_BAR_COLOR = 0x38bdf8;
const PLAYER_BAR_FILL_ALPHA = 0.95;

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

  it('draws health and mana bars along the north-west and north-east edges of the current hex', async () => {
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

    const resourceGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const hexOriginX = app.screen.width / 2;
    const hexOriginY = app.screen.height / 2;
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const thickness = Math.max(3, hexSize * 1.58 * 0.075);
    const healthTrack = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_HEALTH_BAR_COLOR,
      alpha: PLAYER_BAR_TRACK_ALPHA,
      slope: -1 / Math.sqrt(3),
      centroidX: { kind: 'lt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });
    const healthFill = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_HEALTH_BAR_COLOR,
      alpha: PLAYER_BAR_FILL_ALPHA,
      slope: -1 / Math.sqrt(3),
      centroidX: { kind: 'lt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });
    const manaTrack = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_MANA_BAR_COLOR,
      alpha: PLAYER_BAR_TRACK_ALPHA,
      slope: 1 / Math.sqrt(3),
      centroidX: { kind: 'gt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });
    const manaFill = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_MANA_BAR_COLOR,
      alpha: PLAYER_BAR_FILL_ALPHA,
      slope: 1 / Math.sqrt(3),
      centroidX: { kind: 'gt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });

    expect(healthTrack).toBeDefined();
    expect(healthFill).toBeDefined();
    expect(manaTrack).toBeDefined();
    expect(manaFill).toBeDefined();
    assertQuadMatchesEdge({
      expectedEnd: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (3 * Math.PI) / 2,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (7 * Math.PI) / 6,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(healthTrack!),
    });
    assertQuadMatchesEdge({
      expectedEnd: midpointAlongEdge(
        vertexAtAngle(hexOriginX, hexOriginY, hexSize, (7 * Math.PI) / 6),
        vertexAtAngle(hexOriginX, hexOriginY, hexSize, (3 * Math.PI) / 2),
        0.5,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (7 * Math.PI) / 6,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(healthFill!),
    });
    assertQuadMatchesEdge({
      expectedEnd: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (11 * Math.PI) / 6,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (3 * Math.PI) / 2,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(manaTrack!),
    });
    assertQuadMatchesEdge({
      expectedEnd: midpointAlongEdge(
        vertexAtAngle(hexOriginX, hexOriginY, hexSize, (3 * Math.PI) / 2),
        vertexAtAngle(hexOriginX, hexOriginY, hexSize, (11 * Math.PI) / 6),
        0.25,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (3 * Math.PI) / 2,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(manaFill!),
    });
  });

  it('keeps the transparent resource track visible across the full edge even when the resource is empty', async () => {
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
    const hexOriginX = app.screen.width / 2;
    const hexOriginY = app.screen.height / 2;
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const thickness = Math.max(3, hexSize * 1.58 * 0.075);
    const healthTrack = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_HEALTH_BAR_COLOR,
      alpha: PLAYER_BAR_TRACK_ALPHA,
      slope: -1 / Math.sqrt(3),
      centroidX: { kind: 'lt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });
    const manaTrack = findEdgeGraphic(resourceGraphics, {
      color: PLAYER_MANA_BAR_COLOR,
      alpha: PLAYER_BAR_TRACK_ALPHA,
      slope: 1 / Math.sqrt(3),
      centroidX: { kind: 'gt', value: hexOriginX },
      centroidY: { kind: 'lt', value: hexOriginY },
    });

    expect(healthTrack).toBeDefined();
    expect(manaTrack).toBeDefined();
    expect(
      resourceGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) =>
            color === PLAYER_HEALTH_BAR_COLOR &&
            alpha === PLAYER_BAR_FILL_ALPHA,
        ),
      ),
    ).toBe(false);
    expect(
      resourceGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) =>
            color === PLAYER_MANA_BAR_COLOR && alpha === PLAYER_BAR_FILL_ALPHA,
        ),
      ),
    ).toBe(false);

    assertQuadMatchesEdge({
      expectedEnd: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (3 * Math.PI) / 2,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (7 * Math.PI) / 6,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(healthTrack!),
    });
    assertQuadMatchesEdge({
      expectedEnd: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (11 * Math.PI) / 6,
      ),
      expectedStart: vertexAtAngle(
        hexOriginX,
        hexOriginY,
        hexSize,
        (3 * Math.PI) / 2,
      ),
      expectedThickness: thickness,
      quad: getQuadPoints(manaTrack!),
    });
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
});

function findEdgeGraphic(
  graphics: MockGraphics[],
  {
    alpha,
    centroidX,
    centroidY,
    color,
    slope,
  }: {
    alpha: number;
    centroidX: Comparator;
    centroidY: Comparator;
    color: number;
    slope: number;
  },
) {
  return graphics.find((graphic) => {
    if (
      !graphic.beginFill.mock.calls.some(
        ([fillColor, fillAlpha]) => fillColor === color && fillAlpha === alpha,
      )
    ) {
      return false;
    }

    if (graphic.drawPolygon.mock.calls.length === 0) {
      return false;
    }

    const [x1, y1, x2, y2, x3, y3, x4, y4] = getQuadPoints(graphic);
    const edgeSlope = (y2 - y1) / (x2 - x1);
    const centroid = {
      x: (x1 + x2 + x3 + x4) / 4,
      y: (y1 + y2 + y3 + y4) / 4,
    };

    return (
      Math.abs(edgeSlope - slope) < 0.0001 &&
      compare(centroid.x, centroidX) &&
      compare(centroid.y, centroidY)
    );
  });
}

function getQuadPoints(graphic: MockGraphics) {
  const [points] = graphic.drawPolygon.mock.calls[0]!;
  expect(points).toHaveLength(8);
  return points as number[];
}

function assertQuadMatchesEdge({
  expectedEnd,
  expectedStart,
  expectedThickness,
  quad,
}: {
  expectedEnd: { x: number; y: number };
  expectedStart: { x: number; y: number };
  expectedThickness: number;
  quad: number[];
}) {
  const [x1, y1, x2, y2, x3, y3, x4, y4] = quad;
  const edgeVector = {
    x: expectedEnd.x - expectedStart.x,
    y: expectedEnd.y - expectedStart.y,
  };
  const edgeLength = Math.hypot(edgeVector.x, edgeVector.y) || 1;
  const distanceToEdge = (x: number, y: number) =>
    Math.abs(
      edgeVector.y * x -
        edgeVector.x * y +
        expectedEnd.x * expectedStart.y -
        expectedEnd.y * expectedStart.x,
    ) / edgeLength;

  expect(x1).toBeCloseTo(expectedStart.x, 4);
  expect(y1).toBeCloseTo(expectedStart.y, 4);
  expect(x2).toBeCloseTo(expectedEnd.x, 4);
  expect(y2).toBeCloseTo(expectedEnd.y, 4);
  expect(distanceToEdge(x1, y1)).toBeCloseTo(0, 4);
  expect(distanceToEdge(x2, y2)).toBeCloseTo(0, 4);
  expect(distanceToEdge(x3, y3)).toBeCloseTo(expectedThickness, 4);
  expect(distanceToEdge(x4, y4)).toBeCloseTo(expectedThickness, 4);
}

function vertexAtAngle(
  originX: number,
  originY: number,
  radius: number,
  angle: number,
) {
  return {
    x: originX + Math.cos(angle) * radius,
    y: originY + Math.sin(angle) * radius,
  };
}

function midpointAlongEdge(
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
) {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

type Comparator = { kind: 'gt'; value: number } | { kind: 'lt'; value: number };

function compare(value: number, comparator: Comparator) {
  return comparator.kind === 'gt'
    ? value > comparator.value
    : value < comparator.value;
}
