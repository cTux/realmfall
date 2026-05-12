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

export interface ConnectedWorldTerrainPresentation {
  rotation: number;
  signature: string;
  terrainId: ConnectedWorldTerrainId;
}

export function resolveConnectedWorldTerrainId(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
): ConnectedWorldTerrainId {
  return getConnectedWorldTerrainPresentation(tile, visibleTileMap).terrainId;
}

export function getConnectedWorldTerrainPresentation(
  tile: VisibleWorldTile,
  visibleTileMap: Map<string, VisibleWorldTile> | null,
): ConnectedWorldTerrainPresentation {
  if (isUnknownVisibleWorldTile(tile) || visibleTileMap === null) {
    return {
      rotation: 0,
      signature: `${tile.terrain}:base`,
      terrainId: tile.terrain,
    };
  }

  if (tile.terrain !== 'mountain' && tile.terrain !== 'rift') {
    return {
      rotation: 0,
      signature: `${tile.terrain}:base`,
      terrainId: tile.terrain,
    };
  }

  const connectedDirectionIndices = getConnectedDirectionIndices(
    tile,
    visibleTileMap,
  );
  const connectivity = classifyWorldTerrainConnectivity(connectedDirectionIndices);
  const rotationSteps = getConnectivityRotationSteps(
    connectivity,
    connectedDirectionIndices,
  );

  return {
    rotation: (Math.PI / 3) * rotationSteps,
    signature: `${tile.terrain}:${connectivity}:${connectedDirectionIndices.join('.')}`,
    terrainId: CONNECTIVITY_VARIANT_BY_TERRAIN[tile.terrain][connectivity],
  };
}

export function getWorldTerrainConnectivity(
  tile: Pick<VisibleWorldTile, 'coord' | 'terrain'>,
  visibleTileMap: Map<string, VisibleWorldTile>,
): WorldTerrainConnectivity {
  return classifyWorldTerrainConnectivity(
    getConnectedDirectionIndices(tile, visibleTileMap),
  );
}

function getConnectedDirectionIndices(
  tile: Pick<VisibleWorldTile, 'coord' | 'terrain'>,
  visibleTileMap: Map<string, VisibleWorldTile>,
) {
  if (tile.terrain !== 'mountain' && tile.terrain !== 'rift') {
    return [];
  }

  return hexNeighbors(tile.coord)
    .flatMap((neighborCoord, directionIndex) => {
      const neighbor = visibleTileMap.get(hexKey(neighborCoord));
      return (
        neighbor !== undefined &&
        !isUnknownVisibleWorldTile(neighbor) &&
        neighbor.terrain === tile.terrain
          ? [directionIndex]
          : []
      );
    });
}

function classifyWorldTerrainConnectivity(
  connectedDirectionIndices: number[],
): WorldTerrainConnectivity {
  if (connectedDirectionIndices.length === 0) {
    return 'isolated';
  }

  if (connectedDirectionIndices.length === 1) {
    return 'end';
  }

  if (connectedDirectionIndices.length >= 4) {
    return 'massif';
  }

  if (connectedDirectionIndices.length >= 3) {
    return 'fork';
  }

  const [firstIndex, secondIndex] = connectedDirectionIndices;
  if (firstIndex == null || secondIndex == null) {
    return 'straight';
  }

  return areOppositeDirections(firstIndex, secondIndex) ? 'straight' : 'bend';
}

function getConnectivityRotationSteps(
  connectivity: WorldTerrainConnectivity,
  connectedDirectionIndices: number[],
) {
  switch (connectivity) {
    case 'end':
      return connectedDirectionIndices[0] ?? 0;
    case 'straight': {
      const primary = connectedDirectionIndices[0] ?? 0;
      return primary % 3;
    }
    case 'bend': {
      const pair = normalizeConsecutiveDirectionPair(connectedDirectionIndices);
      return pair[0] ?? 0;
    }
    case 'fork':
      return getForkPrimaryDirection(connectedDirectionIndices);
    default:
      return 0;
  }
}

function normalizeConsecutiveDirectionPair(directionIndices: number[]) {
  const normalized = [...directionIndices].sort((left, right) => left - right);
  if (
    normalized.length === 2 &&
    normalized[0] === 0 &&
    normalized[1] === 5
  ) {
    return [5, 0];
  }

  return normalized;
}

function getForkPrimaryDirection(directionIndices: number[]) {
  if (directionIndices.length < 3) {
    return directionIndices[0] ?? 0;
  }

  const unique = [...new Set(directionIndices)].sort((left, right) => left - right);
  const wrapped = [...unique, unique[0]! + 6, unique[1]! + 6];
  let bestRunStart = unique[0] ?? 0;

  for (let index = 0; index < unique.length; index += 1) {
    const first = wrapped[index];
    const second = wrapped[index + 1];
    const third = wrapped[index + 2];

    if (
      first != null &&
      second != null &&
      third != null &&
      second - first === 1 &&
      third - second === 1
    ) {
      bestRunStart = first % 6;
      break;
    }
  }

  return (bestRunStart + 1) % 6;
}

function areOppositeDirections(firstIndex: number, secondIndex: number) {
  return Math.abs(firstIndex - secondIndex) === 3;
}
