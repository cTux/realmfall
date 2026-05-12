import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import { TERRAINS } from '@realmfall/core/game/stateTypes';
import type { VisibleWorldTile } from './visibleWorldTiles';

function isGameplayTerrain(
  terrain: string,
): terrain is (typeof TERRAINS)[number] {
  return (TERRAINS as readonly string[]).includes(terrain);
}

describe('worldTerrainArt', () => {
  it('uses generated atlas frame ids for runtime terrain art', async () => {
    const {
      getWorldTerrainAtlasImage,
      getWorldTerrainAssetIds,
      getWorldTerrainFrameId,
      terrainArtForVisibleTile,
      terrainArtFor,
    } = await import('./worldTerrainArtTestkit');

    const terrains = Object.keys(worldTerrainAtlasManifest.frames) as Array<
      keyof typeof worldTerrainAtlasManifest.frames
    >;

    expect(getWorldTerrainAtlasImage()).toBe(worldTerrainAtlasImage);
    expect(getWorldTerrainAssetIds()).toEqual(
      terrains.map((terrain) => getWorldTerrainFrameId(terrain)),
    );

    for (const terrain of terrains) {
      expect(getWorldTerrainFrameId(terrain)).not.toBe(
        worldTerrainAtlasManifest.frames[terrain].source,
      );

      if (isGameplayTerrain(terrain)) {
        expect(terrainArtFor(terrain)).toBe(getWorldTerrainFrameId(terrain));
      }
    }

    const connectedMountainTile: VisibleWorldTile = {
      coord: { q: 0, r: 0 },
      terrain: 'mountain',
      items: [],
      enemyIds: [],
    };
    const connectedMountainMap = new Map<string, VisibleWorldTile>([
      ['0,0', connectedMountainTile],
      [
        '0,-1',
        {
          coord: { q: 0, r: -1 },
          terrain: 'mountain',
          items: [],
          enemyIds: [],
        },
      ],
      [
        '0,1',
        { coord: { q: 0, r: 1 }, terrain: 'mountain', items: [], enemyIds: [] },
      ],
    ]);

    expect(
      terrainArtForVisibleTile(connectedMountainTile, connectedMountainMap),
    ).toBe(getWorldTerrainFrameId('mountain-straight'));
  });
});
