import { hexKey, type HexCoord } from '@realmfall/core/game/hex';
import type { Terrain } from '@realmfall/core/game/stateTypes';
import type { VisibleWorldTile } from './visibleWorldTiles';

function createVisibleTile(
  coord: HexCoord,
  terrain: Terrain,
): VisibleWorldTile {
  return {
    coord,
    terrain,
    items: [],
    enemyIds: [],
  };
}

function createVisibleTileMap(
  center: VisibleWorldTile,
  neighborCoords: readonly HexCoord[],
) {
  const tiles = [
    center,
    ...neighborCoords.map((coord) => createVisibleTile(coord, center.terrain)),
  ];
  return new Map(tiles.map((tile) => [hexKey(tile.coord), tile] as const));
}

describe('worldTerrainConnectivity', () => {
  it.each([
    {
      terrain: 'mountain' as const,
      expected: {
        isolated: 'mountain-isolated',
        end: 'mountain-end',
        straight: 'mountain-straight',
        bend: 'mountain-bend',
        fork: 'mountain-fork',
        massif: 'mountain-massif',
      },
    },
    {
      terrain: 'rift' as const,
      expected: {
        isolated: 'rift-isolated',
        end: 'rift-end',
        straight: 'rift-straight',
        bend: 'rift-bend',
        fork: 'rift-fork',
        massif: 'rift-massif',
      },
    },
  ])(
    'maps $terrain neighborhoods to connectivity variants',
    async ({ terrain, expected }) => {
      const {
        getWorldTerrainFrameId,
        getWorldTerrainPresentation,
        terrainArtForVisibleTile,
      } =
        await import('./worldTerrainArt');
      const { getWorldTerrainConnectivity } =
        await import('./worldTerrainConnectivity');

      const center = createVisibleTile({ q: 0, r: 0 }, terrain);
      const north = { q: 0, r: -1 };
      const south = { q: 0, r: 1 };
      const northEast = { q: 1, r: -1 };
      const east = { q: 1, r: 0 };
      const southWest = { q: -1, r: 1 };
      const southEast = { q: 0, r: 1 };

      const cases = [
        {
          name: 'isolated',
          coords: [],
          rotation: 0,
          variant: expected.isolated,
        },
        { name: 'end', coords: [east], rotation: 0, variant: expected.end },
        {
          name: 'straight',
          coords: [north, south],
          rotation: (Math.PI / 3) * 2,
          variant: expected.straight,
        },
        {
          name: 'bend',
          coords: [east, northEast],
          rotation: 0,
          variant: expected.bend,
        },
        {
          name: 'fork',
          coords: [southEast, east, northEast],
          rotation: 0,
          variant: expected.fork,
        },
        {
          name: 'massif',
          coords: [east, northEast, north, southWest],
          rotation: 0,
          variant: expected.massif,
        },
      ] as const satisfies ReadonlyArray<{
        name: string;
        coords: readonly HexCoord[];
        rotation: number;
        variant: string;
      }>;

      for (const entry of cases) {
        const visibleTileMap = createVisibleTileMap(center, entry.coords);
        expect(getWorldTerrainConnectivity(center, visibleTileMap)).toBe(
          entry.name,
        );
        expect(terrainArtForVisibleTile(center, visibleTileMap)).toBe(
          getWorldTerrainFrameId(
            entry.variant as Parameters<typeof getWorldTerrainFrameId>[0],
          ),
        );
        expect(getWorldTerrainPresentation(center, visibleTileMap).rotation).toBe(
          entry.rotation,
        );
      }
    },
  );

  it('falls back to the canonical terrain frame without neighborhood context', async () => {
    const { getWorldTerrainFrameId, terrainArtForVisibleTile } =
      await import('./worldTerrainArt');

    const tile = createVisibleTile({ q: 0, r: 0 }, 'mountain');

    expect(terrainArtForVisibleTile(tile, null)).toBe(
      getWorldTerrainFrameId('mountain'),
    );
  });
});
