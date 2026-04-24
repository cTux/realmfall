import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import type { Terrain } from '../../game/stateTypes';

describe('worldTerrainArt', () => {
  it('uses generated atlas frame ids for runtime terrain art', async () => {
    const {
      getWorldTerrainAtlasImage,
      getWorldTerrainAssetIds,
      getWorldTerrainFrameId,
      terrainArtFor,
    } = await import('./worldTerrainArt');

    const terrains = Object.keys(worldTerrainAtlasManifest.frames) as Terrain[];

    expect(getWorldTerrainAtlasImage()).toBe(worldTerrainAtlasImage);
    expect(getWorldTerrainAssetIds()).toEqual(
      terrains.map((terrain) => getWorldTerrainFrameId(terrain)),
    );

    for (const terrain of terrains) {
      expect(terrainArtFor(terrain)).toBe(getWorldTerrainFrameId(terrain));
      expect(terrainArtFor(terrain)).not.toBe(
        worldTerrainAtlasManifest.frames[terrain].source,
      );
    }
  });
});
