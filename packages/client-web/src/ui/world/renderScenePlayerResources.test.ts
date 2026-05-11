import { createGame } from '@realmfall/core/game/stateFactory';
import { getVisibleTiles } from '@realmfall/core/game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getPlayerLayer,
  MockGraphics,
  MockSprite,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestkit';

setupRenderSceneTestEnvironment();

const PLAYER_BACKGROUND_COLOR = 0x4ade80;
const PLAYER_BACKGROUND_ALPHA = 0.6;
const PLAYER_HEALTH_TRACK_COLOR = 0x450a0a;
const PLAYER_HEALTH_FILL_COLOR = 0xff2d55;
const PLAYER_MANA_TRACK_COLOR = 0x172554;
const PLAYER_MANA_FILL_COLOR = 0x38bdf8;
const BADGE_PLATE_BACKGROUND_COLOR = 0x000000;
const BADGE_PLATE_TEXT_COLOR = 0xffffff;

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

  it('renders the player inside a green circular badge with top HP, bottom MP, and a level plate', async () => {
    const { renderScene } = await import('./renderScene');
    const { applyInterfaceFontFamily, resolveInterfaceFontStack } =
      await import('../../app/interfaceFonts');
    const game = createGame(2, 'render-scene-player-resources');
    const app = createMockApp();
    game.player.baseMaxHp = 100;
    game.player.hp = 50;
    game.player.baseMaxMana = 20;
    game.player.mana = 5;
    applyInterfaceFontFamily('ubuntu');

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
    const playerSprites = playerLayerEntries.filter(
      (child): child is MockSprite =>
        child instanceof MockSprite &&
        child.visible &&
        child.tint !== 0x000000 &&
        child.width > 0,
    );
    const playerSprite = playerSprites[playerSprites.length - 1];
    const backgroundGraphic = findBadgeBackground(resourceGraphics);
    const levelText = playerTexts.find(
      (child) =>
        child.text === game.player.level.toString() && child.position.y < 0,
    );
    const levelPlateGraphic = findBadgePlate(resourceGraphics);
    const healthTrack = findHemisphereArc(
      resourceGraphics,
      PLAYER_HEALTH_TRACK_COLOR,
      'top',
    );

    expect(backgroundGraphic).toBeDefined();
    expect(
      backgroundGraphic?.beginFill.mock.calls.some(
        ([fillColor, alpha]) =>
          fillColor === PLAYER_BACKGROUND_COLOR &&
          alpha === PLAYER_BACKGROUND_ALPHA,
      ),
    ).toBe(true);
    expect(backgroundGraphic?.lineStyle).not.toHaveBeenCalled();
    expect(levelText).toBeDefined();
    expect(levelText?.scale.x).toBeLessThanOrEqual(0.6);
    expect(levelText?.scale.y).toBeLessThanOrEqual(0.6);
    expect(getTextFill(levelText!)).toBe(BADGE_PLATE_TEXT_COLOR);
    expect(getTextFontFamily(levelText!)).toBe(
      resolveInterfaceFontStack('ubuntu'),
    );
    expect(levelPlateGraphic).toBeDefined();
    expect(
      levelPlateGraphic?.beginFill.mock.calls.some(
        ([fillColor]) => fillColor === BADGE_PLATE_BACKGROUND_COLOR,
      ),
    ).toBe(true);
    expect(levelPlateGraphic?.lineStyle).not.toHaveBeenCalled();
    expect(
      levelPlateGraphic?.drawRect.mock.calls.every(
        ([, , , height]) => (height as number) <= 10,
      ),
    ).toBe(true);
    expect(levelPlateGraphic).toBeDefined();
    expect(getEllipseRadius(backgroundGraphic!)).toBeLessThan(
      (playerSprite?.width ?? Number.POSITIVE_INFINITY) * 0.72,
    );
    expect(healthTrack).toBeDefined();
    expect(
      getGraphicThickness(healthTrack!) / getMaxGraphicRadius(healthTrack!),
    ).toBeLessThanOrEqual(0.1);
    expect(
      getMaxGraphicRadius(healthTrack!) - getEllipseRadius(backgroundGraphic!),
    ).toBeCloseTo(0, 3);
    assertPlateOverlapsRingCenter(levelPlateGraphic!, healthTrack!, 'top');
    expect(levelText?.position.y).toBeCloseTo(
      -getGraphicCenterRadius(healthTrack!),
      1,
    );
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_HEALTH_FILL_COLOR, 'top'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_TRACK_COLOR, 'bottom'),
    ).toBeDefined();
    expect(
      findHemisphereArc(resourceGraphics, PLAYER_MANA_FILL_COLOR, 'bottom'),
    ).toBeDefined();

    applyInterfaceFontFamily('pixelifySans');
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

function findBadgeBackground(graphics: MockGraphics[]) {
  return graphics.find((graphic) =>
    graphic.beginFill.mock.calls.some(
      ([fillColor]) => fillColor === PLAYER_BACKGROUND_COLOR,
    ),
  );
}

function findBadgePlate(graphics: MockGraphics[]) {
  return graphics.find((graphic) => graphic.drawRect.mock.calls.length > 0);
}

function getEllipseRadius(graphic: MockGraphics) {
  const [, , radiusX] = graphic.drawEllipse.mock.calls[0] as [
    number,
    number,
    number,
    number,
  ];
  return radiusX;
}

function getMaxGraphicRadius(graphic: MockGraphics) {
  return Math.max(
    ...graphic.drawPolygon.mock.calls.flatMap(([points]) => {
      const numericPoints = points as number[];
      const radii: number[] = [];
      for (let index = 0; index < numericPoints.length; index += 2) {
        radii.push(
          Math.hypot(numericPoints[index] ?? 0, numericPoints[index + 1] ?? 0),
        );
      }
      return radii;
    }),
  );
}

function getMinGraphicRadius(graphic: MockGraphics) {
  return Math.min(
    ...graphic.drawPolygon.mock.calls.flatMap(([points]) => {
      const numericPoints = points as number[];
      const radii: number[] = [];
      for (let index = 0; index < numericPoints.length; index += 2) {
        radii.push(
          Math.hypot(numericPoints[index] ?? 0, numericPoints[index + 1] ?? 0),
        );
      }
      return radii;
    }),
  );
}

function getGraphicThickness(graphic: MockGraphics) {
  return getMaxGraphicRadius(graphic) - getMinGraphicRadius(graphic);
}

function getGraphicCenterRadius(graphic: MockGraphics) {
  return (getMaxGraphicRadius(graphic) + getMinGraphicRadius(graphic)) / 2;
}

function assertPlateOverlapsRingCenter(
  graphic: MockGraphics,
  ringGraphic: MockGraphics,
  placement: 'bottom' | 'top',
) {
  const [, y, , height] = graphic.drawRect.mock.calls[0] as [
    number,
    number,
    number,
    number,
  ];
  const plateTop = y;
  const plateBottom = y + height;
  const ringCenter =
    (placement === 'top' ? -1 : 1) * getGraphicCenterRadius(ringGraphic);

  expect(plateTop).toBeLessThan(ringCenter);
  expect(plateBottom).toBeGreaterThan(ringCenter);
}

function getTextFill(text: MockText) {
  return (text.style as { value?: { fill?: number } }).value?.fill;
}

function getTextFontFamily(text: MockText) {
  return (text.style as { value?: { fontFamily?: string } }).value?.fontFamily;
}
