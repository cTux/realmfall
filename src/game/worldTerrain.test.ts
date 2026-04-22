import { hexKey, hexNeighbors } from './hex';
import { getWorldBiomeFields, pickWorldTerrain } from './worldTerrain';

describe('worldTerrain', () => {
  it('keeps biome fields deterministic for the same seed and coord', () => {
    const fields = getWorldBiomeFields('world-biome-fields', { q: 4, r: -3 });

    expect(getWorldBiomeFields('world-biome-fields', { q: 4, r: -3 })).toEqual(
      fields,
    );
  });

  it('generates terrain in clustered biome regions instead of isolated random picks', () => {
    const terrainByKey = new Map<string, ReturnType<typeof pickWorldTerrain>>();
    const terrainKinds = new Set<ReturnType<typeof pickWorldTerrain>>();

    for (let q = -9; q <= 9; q += 1) {
      for (let r = -9; r <= 9; r += 1) {
        if (Math.abs(q + r) > 9) {
          continue;
        }

        const coord = { q, r };
        const terrain = pickWorldTerrain('clustered-biomes', coord);
        terrainByKey.set(hexKey(coord), terrain);
        terrainKinds.add(terrain);
        terrainKinds.add(pickWorldTerrain('clustered-biomes-alt', coord));
      }
    }

    let sharedNeighborEdges = 0;
    let totalNeighborEdges = 0;

    for (const [key, terrain] of terrainByKey) {
      const [q, r] = key.split(',').map(Number);
      const coord = { q, r };

      for (const neighbor of hexNeighbors(coord)) {
        if (neighbor.q < q || (neighbor.q === q && neighbor.r <= r)) {
          continue;
        }

        const neighborTerrain = terrainByKey.get(hexKey(neighbor));
        if (!neighborTerrain) {
          continue;
        }

        totalNeighborEdges += 1;
        if (neighborTerrain === terrain) {
          sharedNeighborEdges += 1;
        }
      }
    }

    expect(sharedNeighborEdges / totalNeighborEdges).toBeGreaterThan(0.44);
    expect(terrainKinds.size).toBeGreaterThanOrEqual(5);
  });
});
