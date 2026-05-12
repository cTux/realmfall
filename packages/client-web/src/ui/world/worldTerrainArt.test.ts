import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import { TERRAINS } from '@realmfall/core/game/stateTypes';

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
  });
});
