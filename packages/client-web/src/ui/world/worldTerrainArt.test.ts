import worldTerrainAtlasManifest from '../../assets/generated/world-terrain-atlas.json';
import worldTerrainAtlasImage from '../../assets/generated/world-terrain-atlas.png';
import { TERRAINS } from '@realmfall/core/game/stateTypes';
import type { VisibleWorldTile } from './visibleWorldTiles';

function isGameplayTerrain(
  terrain: string,
): terrain is (typeof TERRAINS)[number] {
  return (TERRAINS as readonly string[]).includes(terrain);
}

const canonicalBlockerTerrains = [
  'mountain-isolated',
  ...Array.from(
    { length: 63 },
    (_, index) =>
      `mountain-connect-${Array.from({ length: 6 }, (_, directionIndex) =>
        (index + 1) & (1 << directionIndex) ? '1' : '0',
      ).join('')}`,
  ),
  'rift-straight',
  'rift-bend',
  'rift-fork',
  'rift-end',
  'rift-isolated',
  'rift-massif',
] as const;
const paintedBlockerTerrainSourceMap = new Map(
  canonicalBlockerTerrains.map((id) => [
    id,
    `packages/client-web/src/assets/images/terrain/painted/${id}.png`,
  ]),
);

describe('worldTerrainArt', () => {
  it('requires painted blocker terrain files for every canonical connectivity class', async () => {
    const { getWorldTerrainFrameId } = await import('./worldTerrainArtTestkit');

    for (const terrain of canonicalBlockerTerrains) {
      expect(
        getWorldTerrainFrameId(
          terrain as Parameters<typeof getWorldTerrainFrameId>[0],
        ),
      ).toContain(terrain);
      expect(paintedBlockerTerrainSourceMap.get(terrain)).toBe(
        `packages/client-web/src/assets/images/terrain/painted/${terrain}.png`,
      );
    }
  });

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
    ).toBe(getWorldTerrainFrameId('mountain-connect-001001'));
  });
});
