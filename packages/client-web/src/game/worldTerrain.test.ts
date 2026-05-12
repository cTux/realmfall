import { describe, expect, it } from 'vitest';

import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { isPassable } from './shared';
import {
  buildMacroTerrainFeatures,
  buildTerrainProvinceMap,
  buildSampledTerrainProvinceMap,
  getTerrainContentTerrain,
  getTerrainGameplayFamily,
  getTerrainProvinceAt,
  getTerrainTierBonus,
  isPassableTerrain,
  isWorldBossTerrain,
  pickTerrain,
} from './worldTerrainTestkit';

describe('worldTerrain', () => {
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

  it('keeps each sampled biome province at or above twenty connected hexes', () => {
    expect(findSmallProvince('terrain-province-size', 16)).toBeNull();
  });

  it('keeps exported province identities aligned with the runtime province surface', () => {
    expect(
      findProvinceIdentityMismatch('terrain-province-identity', 16),
    ).toBeNull();
  });

  it('keeps runtime province memberships self-consistent', () => {
    expect(
      findRuntimeProvinceMembershipMismatch('terrain-province-membership', 16),
    ).toBeNull();
  });

  it('forms connected mountain ranges and rift belts instead of isolated blockers', () => {
    const summary = summarizeBlockerFeatures('terrain-features', 18);

    expect(summary.longestMountainChain).toBeGreaterThanOrEqual(6);
    expect(summary.longestRiftChain).toBeGreaterThanOrEqual(5);
  });

  it('surfaces a broader terrain catalog across different deterministic worlds', () => {
    const terrains = new Set(
      ['biome-rich-a', 'biome-rich-b', 'biome-rich-c', 'biome-rich-d'].flatMap(
        (seed) => sampleCoords(14).map((coord) => pickTerrain(seed, coord)),
      ),
    );

    expect(terrains.size).toBeGreaterThanOrEqual(11);
  });

  it('maps visual terrain variants back to canonical gameplay terrain families', () => {
    expect(getTerrainGameplayFamily('plains-bloom')).toBe('plains');
    expect(getTerrainGameplayFamily('forest-moss')).toBe('forest');
    expect(getTerrainGameplayFamily('mountain-ridge')).toBe('mountain');
    expect(getTerrainGameplayFamily('rift-fork')).toBe('rift');
  });

  it('preserves representative canonical terrain gameplay properties', () => {
    expect(isPassableTerrain('plains')).toBe(true);
    expect(getTerrainContentTerrain('plains')).toBe('plains');

    expect(isWorldBossTerrain('forest')).toBe(true);
    expect(getTerrainContentTerrain('forest')).toBe('forest');

    expect(isPassableTerrain('mountain')).toBe(false);
    expect(getTerrainTierBonus('mountain')).toBe(2);
    expect(getTerrainContentTerrain('mountain')).toBe('mountain');

    expect(isPassableTerrain('rift')).toBe(false);
    expect(getTerrainContentTerrain('rift')).toBe('rift');
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

function findSmallProvince(seed: string, radius: number) {
  const sampledCoords = sampleCoords(radius);
  const sampledCoordKeys = new Set(sampledCoords.map((coord) => hexKey(coord)));
  const provinces = buildSampledTerrainProvinceMap(seed, sampledCoords);
  return (
    provinces.find(
      (province) =>
        province.members.some(
          (coord) => !sampledCoordKeys.has(hexKey(coord)),
        ) ||
        province.members.length < 20 ||
        connectedSize(province.members) !== province.members.length,
    ) ?? null
  );
}

function findProvinceIdentityMismatch(seed: string, radius: number) {
  const provinces = buildTerrainProvinceMap(seed, sampleCoords(radius));
  return (
    provinces.find((province) =>
      province.members.some(
        (coord) => getTerrainProvinceAt(seed, coord).id !== province.id,
      ),
    ) ?? null
  );
}

function findRuntimeProvinceMembershipMismatch(seed: string, radius: number) {
  return (
    sampleCoords(radius).find((coord) => {
      const province = getTerrainProvinceAt(seed, coord);
      return province.members.some(
        (memberCoord) =>
          getTerrainProvinceAt(seed, memberCoord).id !== province.id,
      );
    }) ?? null
  );
}

function summarizeBlockerFeatures(seed: string, radius: number) {
  const coords = sampleCoords(radius);
  const features = buildMacroTerrainFeatures(seed, coords);

  return {
    longestMountainChain: longestConnectedFeatureChain(features, 'mountain'),
    longestRiftChain: longestConnectedFeatureChain(features, 'rift'),
  };
}

function connectedSize(coords: HexCoord[]) {
  if (coords.length === 0) {
    return 0;
  }

  const coordByKey = new Map(coords.map((coord) => [hexKey(coord), coord]));
  const frontier = [coords[0]!];
  const visited = new Set<string>([hexKey(coords[0]!)]);

  while (frontier.length > 0) {
    const current = frontier.pop();
    if (!current) {
      continue;
    }

    for (const neighbor of hexNeighbors(current)) {
      const neighborKey = hexKey(neighbor);
      if (!coordByKey.has(neighborKey) || visited.has(neighborKey)) {
        continue;
      }

      visited.add(neighborKey);
      frontier.push(coordByKey.get(neighborKey)!);
    }
  }

  return visited.size;
}

function longestConnectedFeatureChain(
  features: ReturnType<typeof buildMacroTerrainFeatures>,
  terrain: 'mountain' | 'rift',
) {
  const filteredFeatures = features.filter(
    (feature) => feature.terrain === terrain,
  );
  const featureByKey = new Map(
    filteredFeatures.map((feature) => [hexKey(feature.coord), feature.coord]),
  );
  const visited = new Set<string>();
  let longestChain = 0;

  for (const feature of filteredFeatures) {
    const startKey = hexKey(feature.coord);
    if (visited.has(startKey)) {
      continue;
    }

    const frontier = [feature.coord];
    visited.add(startKey);
    let chainSize = 0;

    while (frontier.length > 0) {
      const current = frontier.pop();
      if (!current) {
        continue;
      }

      chainSize += 1;

      for (const neighbor of hexNeighbors(current)) {
        const neighborKey = hexKey(neighbor);
        if (!featureByKey.has(neighborKey) || visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        frontier.push(featureByKey.get(neighborKey)!);
      }
    }

    longestChain = Math.max(longestChain, chainSize);
  }

  return longestChain;
}
