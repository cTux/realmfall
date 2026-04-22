import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getWorld,
  MockGraphics,
  MockSprite,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

describe('renderScene interactions', () => {
  it('does not draw the selected outline on the player tile', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-selection');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const selectionOutlines = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xf8fafc && alpha === 0.65,
        ),
    );

    expect(selectionOutlines).toHaveLength(0);
  });

  it('removes hover outline and brightens the hovered hex fill', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-hovered-tile');
    const hoveredHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: hoveredHex,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      hoveredHex,
      12 * 60,
    );

    const worldDescendants = collectDescendants(getWorld(app));
    const hoverOutlines = worldDescendants.filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xe2e8f0 && alpha === 0.85,
        ),
    );
    const brightHoveredFill = worldDescendants.some(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x38bdf8 && alpha === 0.34,
        ),
    );

    expect(hoverOutlines).toHaveLength(0);
    expect(brightHoveredFill).toBe(true);
  });

  it('draws a purple tint around the home hex', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-home-hex');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
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

    const homeTint = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xa855f7 && alpha === 0.22,
        ),
    );

    expect(homeTint).toHaveLength(1);
  });

  it('draws player territory borders without a banner marker', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-claim');
    game.homeHex = { q: 2, r: -2 };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        ownerId: 'player-territory',
        ownerType: 'player',
        ownerName: 'Bound Territory',
        borderColor: '#ffffff',
      },
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

    const territoryBorders = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 4 && color === 0xffffff && alpha === 0.92,
        ),
    );

    expect(territoryBorders.length).toBeGreaterThan(0);
  });

  it('does not split a territory border when a same-owner neighbor is off-screen', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-offscreen-claim-neighbor');
    game.player.coord = { q: -1, r: 0 };
    game.homeHex = { q: -2, r: 0 };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      [game.tiles['0,0']],
      { q: 0, r: 0 },
      null,
      12 * 60,
    );

    const territoryBorders = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xffffff && alpha === 0.92,
        ),
    );

    expect(territoryBorders).toHaveLength(5);
  });

  it('highlights each hovered safe-path hex on the interaction layer', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-safe-path');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 2, r: 0 },
      12 * 60,
      0,
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    );

    const safePathTint = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x38bdf8 && alpha === 0.34,
        ),
    );

    expect(safePathTint).toHaveLength(2);
  });

  it('renders a terrain background sprite for revealed biome tiles', async () => {
    const { renderScene } = await import('./renderScene');
    const { terrainArtFor } = await import('./worldTerrainArt');
    const game = createGame(2, 'render-scene-terrain-background');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'desert',
      items: [],
      enemyIds: [],
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

    const desertTerrainSprites = collectDescendants(getWorld(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.icon === terrainArtFor('desert'),
    );

    expect(desertTerrainSprites.length).toBeGreaterThan(0);
    expect(desertTerrainSprites[0]?.width).toBeGreaterThan(0);
    expect(desertTerrainSprites[0]?.height).toBeGreaterThan(0);
  });

  it('skips terrain background sprites when the graphics setting disables them', async () => {
    const { renderScene } = await import('./renderScene');
    const { terrainArtFor } = await import('./worldTerrainArt');
    const game = createGame(2, 'render-scene-terrain-background-disabled');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'desert',
      items: [],
      enemyIds: [],
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      { showTerrainBackgrounds: false },
    );

    const desertTerrainSprites = collectDescendants(getWorld(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.icon === terrainArtFor('desert'),
    );

    expect(desertTerrainSprites).toHaveLength(0);
  });

  it('keeps structure icons visible when terrain backgrounds are disabled', async () => {
    const { renderScene } = await import('./renderScene');
    const { structureIconFor } = await import('./worldIcons');
    const game = createGame(
      2,
      'render-scene-terrain-background-structure-icon',
    );
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: [],
      structure: 'tree',
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      { showTerrainBackgrounds: false },
    );

    const treeStructureSprites = collectDescendants(getWorld(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.icon === structureIconFor('tree'),
    );

    expect(treeStructureSprites.length).toBeGreaterThan(0);
  });

  it('keeps claim borders visible above hovered safe-path overlays', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-safe-path-claim-border');
    game.tiles['1,0'] = {
      ...game.tiles['1,0'],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 2, r: 0 },
      12 * 60,
      0,
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    );

    const territoryBorders = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xffffff && alpha === 0.92,
        ),
    );

    expect(territoryBorders).toHaveLength(6);
  });
});
