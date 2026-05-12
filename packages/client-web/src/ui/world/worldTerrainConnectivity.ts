import { hexKey, hexNeighbors } from '@realmfall/core/game/hex';
import type { Terrain } from '@realmfall/core/game/stateTypes';
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

const CONNECTIVITY_VARIANT_BY_TERRAIN = {
  mountain: {
    isolated: 'mountain-isolated',
    end: 'mountain-end',
    straight: 'mountain-straight',
    bend: 'mountain-bend',
    fork: 'mountain-fork',
    massif: 'mountain-massif',
  },
  rift: {
    isolated: 'rift-isolated',
    end: 'rift-end',
    straight: 'rift-straight',
    bend: 'rift-bend',
    fork: 'rift-fork',
    massif: 'rift-massif',
  },
} as const;

type ConnectedBlockerTerrain = keyof typeof CONNECTIVITY_VARIANT_BY_TERRAIN;

export type WorldTerrainConnectivity =
  keyof (typeof CONNECTIVITY_VARIANT_BY_TERRAIN)['mountain'];

export type ConnectedWorldTerrainId =
  | Terrain
  | (typeof CONNECTIVITY_VARIANT_BY_TERRAIN)[ConnectedBlockerTerrain][WorldTerrainConnectivity];

export function resolveConnectedWorldTerrainId(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
): ConnectedWorldTerrainId {
  if (isUnknownVisibleWorldTile(tile) || visibleTileMap === null) {
    return tile.terrain;
  }

  if (tile.terrain !== 'mountain' && tile.terrain !== 'rift') {
    return tile.terrain;
  }

  const connectivity = getWorldTerrainConnectivity(tile, visibleTileMap);
  return CONNECTIVITY_VARIANT_BY_TERRAIN[tile.terrain][connectivity];
}

export function getWorldTerrainConnectivity(
  tile: Pick<VisibleWorldTile, 'coord' | 'terrain'>,
  visibleTileMap: Map<string, VisibleWorldTile>,
): WorldTerrainConnectivity {
  if (tile.terrain !== 'mountain' && tile.terrain !== 'rift') {
    return 'isolated';
  }

  const connectedDirections = hexNeighbors(tile.coord).filter(
    (neighborCoord) => {
      const neighbor = visibleTileMap.get(hexKey(neighborCoord));
      return (
        neighbor !== undefined &&
        !isUnknownVisibleWorldTile(neighbor) &&
        neighbor.terrain === tile.terrain
      );
    },
  );

  if (connectedDirections.length === 0) {
    return 'isolated';
  }

  if (connectedDirections.length === 1) {
    return 'end';
  }

  if (connectedDirections.length >= 4) {
    return 'massif';
  }

  if (connectedDirections.length >= 3) {
    return 'fork';
  }

  const [firstDirection, secondDirection] = connectedDirections;
  if (!firstDirection || !secondDirection) {
    return 'straight';
  }

  const firstIndex = directionIndex(tile.coord, firstDirection);
  const secondIndex = directionIndex(tile.coord, secondDirection);
  return Math.abs(firstIndex - secondIndex) === 3 ? 'straight' : 'bend';
}

function directionIndex(
  origin: Pick<VisibleWorldTile, 'coord'>['coord'],
  neighbor: Pick<VisibleWorldTile, 'coord'>['coord'],
) {
  return hexNeighbors(origin).findIndex(
    (candidate) => candidate.q === neighbor.q && candidate.r === neighbor.r,
  );
}
