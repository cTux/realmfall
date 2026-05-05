import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getBadgeLayer,
  getLabelsLayer,
  getMarkerLayer,
  MockGraphics,
  MockSprite,
  MockText,
  playerIcon,
  setupRenderSceneTestEnvironment,
  textureFrom,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

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
        child instanceof MockSprite &&
        child.icon === structureIconFor('copper-ore') &&
        child.visible,
    );

    expect(rareEnemyMarker).toBeDefined();
    expect(whiteStructureMarker).toBeDefined();
    expect(copperOreMarker).toBeDefined();
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

    const markerDescendants = collectDescendants(getMarkerLayer(app));
    const badgeGraphics = markerDescendants.filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const badgeTexts = markerDescendants.filter(
      (child): child is MockText => child instanceof MockText,
    );

    expect(
      badgeGraphics.some(
        (graphic) =>
          graphic.drawEllipse.mock.calls.length > 0 &&
          graphic.beginFill.mock.calls.some(
            ([fillColor]) => fillColor === 0xef4444,
          ),
      ),
    ).toBe(true);
    expect(
      badgeTexts.some((child) => child.text === '2' && child.position.y < 0),
    ).toBe(true);
    expect(
      badgeTexts.some((child) => child.text === '3' && child.position.y > 0),
    ).toBe(true);
    expect(findMarkerArc(badgeGraphics, 0x7f1d1d, 'top')).toBeDefined();
    expect(findMarkerArc(badgeGraphics, 0xff2d55, 'top')).toBeDefined();
    expect(findMarkerArc(badgeGraphics, 0x1e40af, 'bottom')).toBeDefined();
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
