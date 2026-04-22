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

  it('renders a bottom-right count badge for multi-enemy hostile hexes', async () => {
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
      maxHp: 5,
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

    const badgeLayer = getBadgeLayer(app);
    const badgeTexts = badgeLayer.children.filter(
      (child): child is MockText => child instanceof MockText,
    );
    const badgeBackgrounds = badgeLayer.children.filter(
      (child): child is MockGraphics => child instanceof MockGraphics,
    );

    expect(badgeTexts.some((child) => child.text === '3')).toBe(true);
    expect(
      badgeBackgrounds.some((child) =>
        child.drawEllipse.mock.calls.some(
          ([x, y, radiusX, radiusY]) =>
            x > 0 && y > 0 && radiusX === 10 && radiusY === 10,
        ),
      ),
    ).toBe(true);
  });
});
