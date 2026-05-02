import { createGame } from '../../game/stateFactory';
import { hexKey } from '../../game/hex';
import {
  collectDescendants,
  createMockApp,
  getMarkerLayer,
  getWorld,
  MockContainer,
  MockSprite,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';
import {
  createUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

setupRenderSceneTestEnvironment();

describe('renderScene unknown hexes', () => {
  it('renders unresolved hexes without terrain art and with the unknown marker', async () => {
    const { renderScene } = await import('./renderScene');
    const { WorldIcons } = await import('./worldIcons');
    const { terrainArtFor } = await import('./worldTerrainArt');

    const game = createGame(2, 'render-scene-unknown-hex');
    game.tiles[hexKey(game.player.coord)] = {
      coord: game.player.coord,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };

    const visibleTiles: VisibleWorldTile[] = [
      game.tiles[hexKey(game.player.coord)]!,
      createUnknownVisibleWorldTile({ q: 1, r: 0 }, 100),
    ];
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      100,
    );

    const markerSprites = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockSprite => child instanceof MockSprite,
    );
    const worldGround = getWorld(app).children[0] as MockContainer;
    const terrainLayer = worldGround.children[1] as MockContainer;
    const terrainSprites = collectDescendants(terrainLayer).filter(
      (child): child is MockSprite => child instanceof MockSprite,
    );

    expect(
      markerSprites.some(
        (child) => child.icon === WorldIcons.UnknownHex && child.visible,
      ),
    ).toBe(true);
    expect(
      terrainSprites.some(
        (child) =>
          child.icon ===
            terrainArtFor(
              createUnknownVisibleWorldTile({ q: 1, r: 0 }).terrain,
            ) && child.visible,
      ),
    ).toBe(false);
  });

  it('rerenders the static layer while a resolved hex reveal is in progress', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneRenderCounts } = await import('./renderSceneCache');

    const game = createGame(2, 'render-scene-unknown-hex-reveal');
    game.tiles[hexKey(game.player.coord)] = {
      coord: game.player.coord,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: [],
    };

    const visibleTiles: VisibleWorldTile[] = [
      game.tiles[hexKey(game.player.coord)]!,
      {
        ...game.tiles['1,0']!,
        requestedAt: 0,
        resolvedAt: 100,
      },
    ];
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      110,
    );
    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      130,
    );
    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      400,
    );
    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      430,
    );

    expect(getSceneRenderCounts(app as never).static).toBe(3);
  });
});
