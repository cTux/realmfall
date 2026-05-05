import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getBadgeLayer,
  getLabelsLayer,
  getMarkerLayer,
  MockContainer,
  MockGraphics,
  MockSprite,
  MockText,
  playerIcon,
  setupRenderSceneTestEnvironment,
  textureFrom,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

const ENEMY_BACKGROUND_COLOR = 0x2a0505;
const ENEMY_HEALTH_TRACK_COLOR = 0x450a0a;
const ENEMY_MANA_TRACK_COLOR = 0x172554;
const BADGE_PLATE_BACKGROUND_COLOR = 0x000000;
const BADGE_PLATE_TEXT_COLOR = 0xffffff;
const STRUCTURE_BACKGROUND_COLOR = 0x123524;
const STRUCTURE_BACKGROUND_ALPHA = 0.4;
const STRUCTURE_BORDER_COLOR = 0x000000;

function createEnemyMarkerGame(
  seed: string,
  secondEnemyRarity: 'common' | 'rare' | 'epic',
) {
  const game = createGame(2, seed);
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'forest',
    structure: 'town',
    items: [],
    enemyIds: ['enemy-1,0-0', 'enemy-1,0-1'],
  };
  game.tiles['0,1'] = {
    coord: { q: 0, r: 1 },
    terrain: 'plains',
    structure: 'dungeon',
    items: [],
    enemyIds: [],
  };
  game.tiles['0,-1'] = {
    coord: { q: 0, r: -1 },
    terrain: 'plains',
    structure: 'copper-ore',
    items: [],
    enemyIds: [],
  };
  game.tiles['-1,0'] = {
    coord: { q: -1, r: 0 },
    terrain: 'rift',
    items: [
      {
        id: 'gold-1',
        name: 'Gold',
        quantity: 3,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ],
    enemyIds: [],
  };
  game.enemies['enemy-1,0-0'] = {
    id: 'enemy-1,0-0',
    enemyTypeId: 'raider',
    name: 'Raider',
    coord: { q: 1, r: 0 },
    rarity: 'common',
    tier: 2,
    hp: 5,
    maxHp: 5,
    mana: 3,
    maxMana: 10,
    attack: 3,
    defense: 1,
    xp: 5,
    elite: false,
  };
  game.enemies['enemy-1,0-1'] = {
    id: 'enemy-1,0-1',
    enemyTypeId: 'wolf',
    name: 'Wolf',
    coord: { q: 1, r: 0 },
    rarity: secondEnemyRarity,
    tier: 3,
    hp: 7,
    maxHp: 7,
    mana: 6,
    maxMana: 12,
    attack: 4,
    defense: 2,
    xp: 8,
    elite: true,
  };

  return game;
}

describe('renderScene enemy markers', () => {
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

  it('renders highlighted tiles, structures, enemies, and player markers', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons, structureIconFor } = await import('./worldIcons');
    const game = createEnemyMarkerGame('render-scene-seed', 'rare');

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      { q: 0, r: 1 },
      { q: 1, r: 0 },
      12 * 60,
    );

    expect(app.stage.children).toHaveLength(7);
    expect(textureFrom).toHaveBeenCalled();
    expect(
      textureFrom.mock.calls.some(([icon]) => typeof icon === 'string'),
    ).toBe(true);

    const labels = getLabelsLayer(app);
    expect(labels.children.some((child) => child instanceof MockText)).toBe(
      false,
    );

    const markerLayer = getMarkerLayer(app);
    const villageIcon = WorldIcons.Village;
    const townIcon = structureIconFor('town');
    const oreIcon = structureIconFor('copper-ore');
    const rareEnemyMarker = collectDescendants(markerLayer).find(
      (child) =>
        child instanceof MockSprite &&
        child.icon !== playerIcon &&
        child.icon !== villageIcon &&
        child.tint === 0x60a5fa,
    );
    const whiteStructureMarker = collectDescendants(markerLayer).find(
      (child) =>
        child instanceof MockSprite &&
        child.icon !== playerIcon &&
        child.icon !== villageIcon &&
        child.tint === 0xffffff,
    );
    const copperOreMarker = collectDescendants(markerLayer).find(
      (child) =>
        child instanceof MockSprite && child.icon === oreIcon && child.visible,
    );
    const townWrapper = findMarkerWrapperByIcon(markerLayer, townIcon);
    const oreWrapper = findMarkerWrapperByIcon(markerLayer, oreIcon);

    expect(rareEnemyMarker).toBeDefined();
    expect(whiteStructureMarker).toBeDefined();
    expect(copperOreMarker).toBeDefined();
    assertStructureBadgeWrapper(townWrapper);
    assertStructureBadgeWrapper(oreWrapper);
  });

  it('updates a cached enemy marker tint when only visible enemy rarity changes', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons } = await import('./worldIcons');
    const game = createEnemyMarkerGame(
      'render-scene-enemy-rarity-tint',
      'common',
    );
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const markerLayer = getMarkerLayer(app);
    const villageIcon = WorldIcons.Village;
    const initialMarkers = collectDescendants(markerLayer).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite &&
        child.icon !== playerIcon &&
        child.icon !== villageIcon &&
        child.alpha === 1 &&
        child.visible,
    );

    expect(initialMarkers.some((child) => child.tint === 0xf8fafc)).toBe(true);

    renderScene(
      app as never,
      {
        ...game,
        enemies: {
          ...game.enemies,
          'enemy-1,0-1': {
            ...game.enemies['enemy-1,0-1']!,
            rarity: 'epic',
          },
        },
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const updatedMarkers = collectDescendants(markerLayer).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite &&
        child.icon !== playerIcon &&
        child.icon !== villageIcon &&
        child.alpha === 1 &&
        child.visible,
    );

    expect(updatedMarkers.some((child) => child.tint === 0xc084fc)).toBe(true);
  });

  it('renders hostile markers inside a red circular badge with top level and bottom count plates', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-enemy-count-badge');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: ['enemy-1,0-0', 'enemy-1,0-1', 'enemy-1,0-2'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 5,
      maxHp: 10,
      mana: 3,
      maxMana: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-1,0-1'] = {
      id: 'enemy-1,0-1',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      rarity: 'rare',
      tier: 3,
      hp: 7,
      maxHp: 7,
      mana: 6,
      maxMana: 12,
      attack: 4,
      defense: 2,
      xp: 8,
      elite: true,
    };
    game.enemies['enemy-1,0-2'] = {
      id: 'enemy-1,0-2',
      enemyTypeId: 'marauder',
      name: 'Shade',
      coord: { q: 1, r: 0 },
      rarity: 'epic',
      tier: 4,
      hp: 9,
      maxHp: 9,
      mana: 5,
      maxMana: 15,
      attack: 6,
      defense: 3,
      xp: 11,
      elite: true,
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const markerLayer = getMarkerLayer(app);
    const badgeWrapper = markerLayer.children.find((child) => {
      if (!(child instanceof MockContainer)) {
        return false;
      }

      const texts = collectDescendants(child).filter(
        (descendant): descendant is MockText => descendant instanceof MockText,
      );
      return (
        texts.some((text) => text.text === '2' && text.position.y < 0) &&
        texts.some((text) => text.text === '3' && text.position.y > 0)
      );
    }) as MockContainer | undefined;
    const markerDescendants = collectDescendants(badgeWrapper ?? markerLayer);
    const badgeGraphics = markerDescendants.filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const badgeTexts = markerDescendants.filter(
      (child): child is MockText => child instanceof MockText,
    );
    const backgroundGraphic = findBadgeBackground(
      badgeGraphics,
      ENEMY_BACKGROUND_COLOR,
    );
    const badgePlateGraphic = badgeGraphics.find(
      (graphic) => graphic.drawRect.mock.calls.length > 0,
    );
    const levelText = badgeTexts.find(
      (child) => child.text === '2' && child.position.y < 0,
    );
    const countText = badgeTexts.find(
      (child) => child.text === '3' && child.position.y > 0,
    );
    const healthTrack = findMarkerArc(
      badgeGraphics,
      ENEMY_HEALTH_TRACK_COLOR,
      'top',
    );
    const badgeSprites = markerDescendants.filter(
      (child): child is MockSprite => child instanceof MockSprite,
    );
    const badgeSprite = badgeSprites[badgeSprites.length - 1];

    expect(backgroundGraphic).toBeDefined();
    expect(backgroundGraphic?.lineStyle).not.toHaveBeenCalled();
    expect(getEllipseRadius(backgroundGraphic!)).toBeLessThan(
      (badgeSprite?.width ?? Number.POSITIVE_INFINITY) * 0.7,
    );
    expect(levelText).toBeDefined();
    expect(levelText?.scale.x).toBeLessThanOrEqual(0.6);
    expect(levelText?.scale.y).toBeLessThanOrEqual(0.6);
    expect(getTextFill(levelText!)).toBe(BADGE_PLATE_TEXT_COLOR);
    expect(levelText?.position.y).toBeGreaterThan(
      -getEllipseRadius(backgroundGraphic!),
    );
    expect(countText).toBeDefined();
    expect(countText?.scale.x).toBeLessThanOrEqual(0.6);
    expect(countText?.scale.y).toBeLessThanOrEqual(0.6);
    expect(getTextFill(countText!)).toBe(BADGE_PLATE_TEXT_COLOR);
    expect(countText?.position.y).toBeLessThan(
      getEllipseRadius(backgroundGraphic!),
    );
    expect(badgePlateGraphic).toBeDefined();
    expect(
      badgePlateGraphic?.beginFill.mock.calls.some(
        ([fillColor]) => fillColor === BADGE_PLATE_BACKGROUND_COLOR,
      ),
    ).toBe(true);
    expect(badgePlateGraphic?.lineStyle).not.toHaveBeenCalled();
    expect(
      badgePlateGraphic?.drawRect.mock.calls.every(
        ([, , , height]) => (height as number) <= 10,
      ),
    ).toBe(true);
    expect(healthTrack).toBeDefined();
    expect(
      getGraphicThickness(healthTrack!) / getMaxGraphicRadius(healthTrack!),
    ).toBeLessThanOrEqual(0.1);
    expect(
      getMaxGraphicRadius(healthTrack!) - getEllipseRadius(backgroundGraphic!),
    ).toBeCloseTo(0, 3);
    assertPlateOverlapsRingCenter(
      badgePlateGraphic!,
      healthTrack!,
      badgeTexts.find((child) => child.text === '2' && child.position.y < 0)
        ? 'top'
        : 'bottom',
    );
    const manaTrack = findMarkerArc(
      badgeGraphics,
      ENEMY_MANA_TRACK_COLOR,
      'bottom',
    );
    expect(manaTrack).toBeDefined();
    assertPlateOverlapsRingCenter(badgePlateGraphic!, manaTrack!, 'bottom');
    expect(levelText?.position.y).toBeCloseTo(
      -getGraphicCenterRadius(healthTrack!),
      1,
    );
    expect(countText?.position.y).toBeCloseTo(
      getGraphicCenterRadius(manaTrack!),
      1,
    );
    expect(
      findMarkerArc(badgeGraphics, ENEMY_HEALTH_TRACK_COLOR, 'top'),
    ).toBeDefined();
    expect(findMarkerArc(badgeGraphics, 0xff2d55, 'top')).toBeDefined();
    expect(findMarkerArc(badgeGraphics, 0x38bdf8, 'bottom')).toBeDefined();
  });

  it('renders an enemy count badge for dungeon hexes', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-dungeon-count-badge');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      structure: 'dungeon',
      items: [],
      enemyIds: ['enemy-1,0-0', 'enemy-1,0-1'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 5,
      maxHp: 5,
      mana: 3,
      maxMana: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-1,0-1'] = {
      id: 'enemy-1,0-1',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      rarity: 'rare',
      tier: 3,
      hp: 7,
      maxHp: 7,
      mana: 6,
      maxMana: 12,
      attack: 4,
      defense: 2,
      xp: 8,
      elite: true,
    };

    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const badgeLayer = getBadgeLayer(app);
    const badgeTexts = badgeLayer.children.filter(
      (child): child is MockText => child instanceof MockText,
    );

    expect(badgeTexts.some((child) => child.text === '2')).toBe(true);
  });

  it('refreshes visible hostile badge HP and MP arcs during combat without requiring a new enemy map object', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createEnemyMarkerGame(
      'render-scene-live-combat-badge-refresh',
      'common',
    );
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const initialGraphics = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const initialHpArc = findMarkerArc(initialGraphics, 0xff2d55, 'top');
    const initialManaArc = findMarkerArc(initialGraphics, 0x38bdf8, 'bottom');
    const initialHpCallCount = initialHpArc?.drawPolygon.mock.calls.length ?? 0;
    const initialManaCallCount =
      initialManaArc?.drawPolygon.mock.calls.length ?? 0;
    expect(initialHpArc).toBeDefined();
    expect(initialManaArc).toBeDefined();

    game.enemies['enemy-1,0-0']!.hp = 0;
    game.enemies['enemy-1,0-0']!.mana = 1;
    game.combat = {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: true,
      startedAtMs: 0,
      engagement: {
        autoStepOnVictory: false,
        engageMode: 'staged-click',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
      },
      player: {
        abilityIds: ['slash'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 0,
        cooldownEndsAt: {},
        casting: null,
      },
      enemies: {
        'enemy-1,0-0': {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 0,
          cooldownEndsAt: {},
          casting: null,
        },
      },
      enemyStateById: {
        'enemy-1,0-0': {},
      },
    };

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const updatedGraphics = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const updatedHpArc = findMarkerArc(updatedGraphics, 0xff2d55, 'top');
    const updatedManaArc = findMarkerArc(updatedGraphics, 0x38bdf8, 'bottom');

    expect(updatedHpArc).toBe(initialHpArc);
    expect(updatedManaArc).toBe(initialManaArc);
    expect(updatedHpArc?.drawPolygon.mock.calls.length).toBeGreaterThan(
      initialHpCallCount,
    );
    expect(updatedManaArc?.drawPolygon.mock.calls.length).toBeGreaterThan(
      initialManaCallCount,
    );
  });
});

function findMarkerArc(
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

function findBadgeBackground(graphics: MockGraphics[], color: number) {
  return graphics.find(
    (graphic) =>
      graphic.drawEllipse.mock.calls.length > 0 &&
      graphic.beginFill.mock.calls.some(([fillColor]) => fillColor === color),
  );
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

function findMarkerWrapperByIcon(markerLayer: MockContainer, icon: string) {
  return markerLayer.children.find((child) => {
    if (!(child instanceof MockContainer)) {
      return false;
    }

    return collectDescendants(child).some(
      (descendant) =>
        descendant instanceof MockSprite && descendant.icon === icon,
    );
  }) as MockContainer | undefined;
}

function assertStructureBadgeWrapper(wrapper: MockContainer | undefined) {
  expect(wrapper).toBeDefined();
  const descendants = collectDescendants(wrapper!);
  const graphics = descendants.filter(
    (child): child is MockGraphics => child instanceof MockGraphics,
  );
  const sprites = descendants.filter(
    (child): child is MockSprite => child instanceof MockSprite,
  );
  const background = graphics.find(
    (graphic) =>
      graphic.drawEllipse.mock.calls.length > 0 &&
      graphic.beginFill.mock.calls.some(
        ([fillColor, alpha]) =>
          fillColor === STRUCTURE_BACKGROUND_COLOR &&
          alpha === STRUCTURE_BACKGROUND_ALPHA,
      ),
  );

  expect(background).toBeDefined();
  expect(background?.lineStyle).toHaveBeenCalledWith(
    1,
    STRUCTURE_BORDER_COLOR,
    1,
  );
  const mainSprite = sprites[sprites.length - 1];
  expect(mainSprite).toBeDefined();
  expect(mainSprite?.width ?? 0).toBeLessThan(50);
  expect(mainSprite?.height ?? 0).toBeLessThan(50);
  expect(getEllipseRadius(background!)).toBeLessThan(40);
  expect((mainSprite?.width ?? 0) / getEllipseRadius(background!)).toBeLessThan(
    1.3,
  );
  expect(
    graphics.every((graphic) => graphic.drawPolygon.mock.calls.length === 0),
  ).toBe(true);
  expect(
    graphics.every((graphic) => graphic.drawRect.mock.calls.length === 0),
  ).toBe(true);
}
