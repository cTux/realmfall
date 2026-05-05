import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  createPlacedWorldBossRenderGame,
  getMarkerLayer,
  getWorld,
  MockContainer,
  MockGraphics,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

const WORLD_BOSS_BACKGROUND_COLOR = 0x2a0505;
const WORLD_BOSS_HP_TRACK_COLOR = 0x450a0a;
const WORLD_BOSS_MP_TRACK_COLOR = 0x172554;
const BADGE_PLATE_BACKGROUND_COLOR = 0x000000;
const BADGE_PLATE_TEXT_COLOR = 0xffffff;

describe('renderScene world boss markers', () => {
  it('renders world bosses across a dead-forest footprint', async () => {
    const { renderScene } = await import('./renderScene');
    const { enemyIconFor } = await import('./worldIcons');
    const { game } = createPlacedWorldBossRenderGame();
    const app = createMockApp(960, 720);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const world = getWorld(app);
    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const worldBossIcon = enemyIconFor('gluttony');
    const worldBossWrapper = markerWrappers.find((wrapper) =>
      (wrapper.children as Array<{ icon?: string }>).some(
        (child) => child.icon === worldBossIcon,
      ),
    );

    expect(worldBossWrapper).toBeDefined();
    const worldBossHexTints = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x7f1d1d && alpha === 0.22,
        ),
    );
    expect(worldBossHexTints.length).toBe(7);

    const worldBossSprites = (worldBossWrapper?.children ?? []) as Array<{
      icon?: string;
      width?: number;
      height?: number;
      tint?: number;
    }>;
    const worldBossGraphics = (worldBossWrapper?.children ?? []).filter(
      (child): child is MockGraphics => child instanceof MockGraphics,
    );
    const worldBossTexts = (worldBossWrapper?.children ?? []).filter(
      (child): child is MockText => child instanceof MockText,
    );
    const backgroundGraphic = findBadgeBackground(
      worldBossGraphics,
      WORLD_BOSS_BACKGROUND_COLOR,
    );
    const topTrack = findBadgeArc(
      worldBossGraphics,
      WORLD_BOSS_HP_TRACK_COLOR,
      'top',
    );
    const bottomTrack = findBadgeArc(
      worldBossGraphics,
      WORLD_BOSS_MP_TRACK_COLOR,
      'bottom',
    );
    const levelText = worldBossTexts.find(
      (child) => child.text === '10' && child.position.y < 0,
    );
    const badgePlateGraphic = worldBossGraphics.find(
      (graphic) => graphic.drawRect.mock.calls.length > 0,
    );

    expect(backgroundGraphic).toBeDefined();
    expect(backgroundGraphic?.lineStyle).not.toHaveBeenCalled();
    const bossIconSprites = worldBossSprites.filter(
      (child) => child.icon === worldBossIcon,
    );
    const mainSprite = bossIconSprites[bossIconSprites.length - 1];
    expect(mainSprite?.width ?? 0).toBeGreaterThan(66);
    expect(mainSprite?.width ?? 0).toBeLessThan(
      getEllipseRadius(backgroundGraphic!) * 1.8,
    );
    expect(topTrack).toBeDefined();
    expect(bottomTrack).toBeDefined();
    expect(
      getGraphicThickness(topTrack!) / getMaxGraphicRadius(topTrack!),
    ).toBeLessThanOrEqual(0.1);
    expect(
      getMaxGraphicRadius(topTrack!) - getEllipseRadius(backgroundGraphic!),
    ).toBeCloseTo(0, 3);
    expect(levelText).toBeDefined();
    expect(levelText?.scale.x).toBeLessThanOrEqual(0.6);
    expect(levelText?.scale.y).toBeLessThanOrEqual(0.6);
    expect(getTextFill(levelText!)).toBe(BADGE_PLATE_TEXT_COLOR);
    expect(badgePlateGraphic).toBeDefined();
    expect(
      badgePlateGraphic?.beginFill.mock.calls.some(
        ([fillColor]) => fillColor === BADGE_PLATE_BACKGROUND_COLOR,
      ),
    ).toBe(true);
    expect(badgePlateGraphic?.lineStyle).not.toHaveBeenCalled();
    expect(
      badgePlateGraphic?.drawRect.mock.calls.every(
        ([, , , height]) => (height as number) <= 14,
      ),
    ).toBe(true);
    assertPlateOverlapsRingCenter(badgePlateGraphic!, topTrack!, 'top');
    expect(levelText?.position.y).toBeCloseTo(
      -getGraphicCenterRadius(topTrack!),
      1,
    );
    expect(mainSprite?.tint).toBe(0xfb923c);
    expect(mainSprite?.width).toBeGreaterThanOrEqual(58);
    expect(mainSprite?.width).toBeLessThan(70);
    expect(mainSprite?.height).toBeGreaterThanOrEqual(45);
    expect(mainSprite?.height).toBeLessThan(70);
  });
});

function findBadgeBackground(graphics: MockGraphics[], color: number) {
  return graphics.find(
    (graphic) =>
      graphic.drawEllipse.mock.calls.length > 0 &&
      graphic.beginFill.mock.calls.some(([fillColor]) => fillColor === color),
  );
}

function findBadgeArc(
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

    return graphic.drawPolygon.mock.calls.some(([points]) => {
      const numericPoints = points as number[];
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
  const ringCenter =
    (placement === 'top' ? -1 : 1) * getGraphicCenterRadius(ringGraphic);

  expect(
    graphic.drawRect.mock.calls.some(([, y, , height]) => {
      const plateTop = y as number;
      const plateBottom = (y as number) + (height as number);
      return plateTop < ringCenter && plateBottom > ringCenter;
    }),
  ).toBe(true);
}

function getTextFill(text: MockText) {
  return (text.style as { value?: { fill?: number } }).value?.fill;
}
