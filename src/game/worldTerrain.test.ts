import { describe, expect, it } from 'vitest';

import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { isPassable } from './shared';
import { getTerrainProfile, pickTerrain } from './worldTerrain';

describe.skip('worldTerrain', () => {
  it('keeps terrain generation deterministic for the same seed and coordinate', () => {
    expect(pickTerrain('biome-determinism', { q: 7, r: -3 })).toBe(
      pickTerrain('biome-determinism', { q: 7, r: -3 }),
    );
  });

  it('softens the early exploration ring away from blocked biomes', () => {
    const ringTwoCoords = sampleCoords(2).filter(
      (coord) => hexDistance(coord, { q: 0, r: 0 }) === 2,
    );

    expect(
      ringTwoCoords.every((coord) =>
        isPassable(pickTerrain('biome-safe-start', coord)),
      ),
    ).toBe(true);
  });

  it('forms sizeable contiguous terrain clusters instead of tile-by-tile noise', () => {
    expect(largestConnectedClusterSize('biome-clusters', 8)).toBeGreaterThan(8);
  });

  it('keeps connected biome regions at a minimum of 10 tiles', () => {
    const minimumCluster = minimumConnectedBiomeClusterSize(
      'biome-cluster-minimum',
      14,
    );
    expect(minimumCluster).toBeGreaterThanOrEqual(10);
  });

  it('surfaces a broader terrain catalog across different deterministic worlds', () => {
    const terrains = new Set(
      ['biome-rich-a', 'biome-rich-b', 'biome-rich-c', 'biome-rich-d'].flatMap(
        (seed) => sampleCoords(14).map((coord) => pickTerrain(seed, coord)),
      ),
    );

    expect(terrains.size).toBeGreaterThanOrEqual(11);
  });
});

function largestConnectedClusterSize(seed: string, radius: number) {
  const coords = sampleCoords(radius);
  const terrainByKey = new Map(
    coords.map((coord) => [hexKey(coord), pickTerrain(seed, coord)]),
  );
  const coordByKey = new Map(coords.map((coord) => [hexKey(coord), coord]));
  const visited = new Set<string>();
  let largestCluster = 0;

  for (const coord of coords) {
    const startKey = hexKey(coord);
    if (visited.has(startKey)) {
      continue;
    }

    const terrain = terrainByKey.get(startKey);
    if (!terrain) {
      continue;
    }

    const frontier: HexCoord[] = [coord];
    let clusterSize = 0;
    visited.add(startKey);

    while (frontier.length > 0) {
      const current = frontier.pop();
      if (!current) {
        continue;
      }

      clusterSize += 1;

      for (const neighbor of hexNeighbors(current)) {
        if (hexDistance(neighbor, { q: 0, r: 0 }) > radius) {
          continue;
        }

        const neighborKey = hexKey(neighbor);
        if (
          visited.has(neighborKey) ||
          terrainByKey.get(neighborKey) !== terrain ||
          !coordByKey.has(neighborKey)
        ) {
          continue;
        }

        visited.add(neighborKey);
        frontier.push(coordByKey.get(neighborKey)!);
      }
    }

    largestCluster = Math.max(largestCluster, clusterSize);
  }

  return largestCluster;
}

function minimumConnectedBiomeClusterSize(seed: string, radius: number) {
  const coords = sampleCoords(radius);
  const terrainByKey = new Map(
    coords.map((coord) => [hexKey(coord), pickTerrain(seed, coord)]),
  );
  const coordByKey = new Map(coords.map((coord) => [hexKey(coord), coord]));
  const visited = new Set<string>();
  let minimumClusterSize: number | null = null;

  for (const coord of coords) {
    const startKey = hexKey(coord);
    if (visited.has(startKey)) {
      continue;
    }

    const terrain = terrainByKey.get(startKey);
    if (!terrain) {
      continue;
    }

    const startBiome = getTerrainProfile(terrain).biome;
    const frontier: HexCoord[] = [coord];
    visited.add(startKey);

    let clusterSize = 0;

    while (frontier.length > 0) {
      const current = frontier.pop();
      if (!current) {
        continue;
      }

      clusterSize += 1;

      for (const neighbor of hexNeighbors(current)) {
        if (hexDistance(neighbor, { q: 0, r: 0 }) > radius) {
          continue;
        }

        const neighborKey = hexKey(neighbor);
        const neighborTerrain = terrainByKey.get(neighborKey);
        if (
          !neighborTerrain ||
          getTerrainProfile(neighborTerrain).biome !== startBiome
        ) {
          continue;
        }

        if (visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        frontier.push(coordByKey.get(neighborKey)!);
      }
    }

    if (minimumClusterSize === null || clusterSize < minimumClusterSize) {
      minimumClusterSize = clusterSize;
    }
  }

  return minimumClusterSize ?? 0;
}

function sampleCoords(radius: number) {
  const coords: HexCoord[] = [];

  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const coord = { q, r };
      if (hexDistance(coord, { q: 0, r: 0 }) <= radius) {
        coords.push(coord);
      }
    }
  }

  return coords;
}
