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

function createDirectionCoord(directionIndex: number): HexCoord {
  switch (directionIndex) {
    case 0:
      return { q: 1, r: 0 };
    case 1:
      return { q: 1, r: -1 };
    case 2:
      return { q: 0, r: -1 };
    case 3:
      return { q: -1, r: 0 };
    case 4:
      return { q: -1, r: 1 };
    case 5:
      return { q: 0, r: 1 };
    default:
      throw new Error(`Unsupported direction index: ${directionIndex}`);
  }
}

describe('worldTerrainConnectivity', () => {
  it('maps mountain neighborhoods to exact connection-mask variants', async () => {
    const {
      getWorldTerrainFrameId,
      getWorldTerrainPresentation,
      terrainArtForVisibleTile,
    } = await import('./worldTerrainArt');
    const { getWorldTerrainConnectivity } =
      await import('./worldTerrainConnectivity');

    const center = createVisibleTile({ q: 0, r: 0 }, 'mountain');
    const cases = [
      {
        name: 'isolated',
        directions: [],
        variant: 'mountain-isolated',
      },
      {
        name: 'end',
        directions: [0],
        variant: 'mountain-connect-100000',
      },
      {
        name: 'straight',
        directions: [2, 5],
        variant: 'mountain-connect-001001',
      },
      {
        name: 'bend',
        directions: [0, 1],
        variant: 'mountain-connect-110000',
      },
      {
        name: 'fork',
        directions: [0, 1, 5],
        variant: 'mountain-connect-110001',
      },
      {
        name: 'massif',
        directions: [0, 1, 2, 4],
        variant: 'mountain-connect-111010',
      },
    ] as const;

    for (const entry of cases) {
      const visibleTileMap = createVisibleTileMap(
        center,
        entry.directions.map(createDirectionCoord),
      );
      expect(getWorldTerrainConnectivity(center, visibleTileMap)).toBe(
        entry.name,
      );
      expect(terrainArtForVisibleTile(center, visibleTileMap)).toBe(
        getWorldTerrainFrameId(
          entry.variant as Parameters<typeof getWorldTerrainFrameId>[0],
        ),
      );
      expect(getWorldTerrainPresentation(center, visibleTileMap).rotation).toBe(
        0,
      );
    }
  });

  it('keeps rift neighborhoods on coarse connectivity variants', async () => {
    const {
      getWorldTerrainFrameId,
      getWorldTerrainPresentation,
      terrainArtForVisibleTile,
    } = await import('./worldTerrainArt');
    const { getWorldTerrainConnectivity } =
      await import('./worldTerrainConnectivity');

    const center = createVisibleTile({ q: 0, r: 0 }, 'rift');
    const north = { q: 0, r: -1 };
    const south = { q: 0, r: 1 };
    const northEast = { q: 1, r: -1 };
    const east = { q: 1, r: 0 };
    const southWest = { q: -1, r: 1 };

    const cases = [
      {
        name: 'isolated',
        coords: [],
        rotation: 0,
        variant: 'rift-isolated',
      },
      { name: 'end', coords: [east], rotation: 0, variant: 'rift-end' },
      {
        name: 'straight',
        coords: [north, south],
        rotation: (Math.PI / 3) * 2,
        variant: 'rift-straight',
      },
      {
        name: 'bend',
        coords: [east, northEast],
        rotation: 0,
        variant: 'rift-bend',
      },
      {
        name: 'fork',
        coords: [south, east, northEast],
        rotation: 0,
        variant: 'rift-fork',
      },
      {
        name: 'massif',
        coords: [east, northEast, north, southWest],
        rotation: 0,
        variant: 'rift-massif',
      },
    ] as const;

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
  });

  it('falls back to the canonical terrain frame without neighborhood context', async () => {
    const { getWorldTerrainFrameId, terrainArtForVisibleTile } =
      await import('./worldTerrainArt');

    const tile = createVisibleTile({ q: 0, r: 0 }, 'mountain');

    expect(terrainArtForVisibleTile(tile, null)).toBe(
      getWorldTerrainFrameId('mountain'),
    );
  });
});
