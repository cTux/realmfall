import { hexDistance, type HexCoord } from './hex';
import { createRng } from './random';
import type { Terrain } from './types';

interface NoiseLayer {
  scale: number;
  weight: number;
}

interface TerrainProfile {
  biome: 'grassland' | 'woodland' | 'wetland' | 'arid' | 'alpine' | 'corrupted';
  passable: boolean;
  tierBonus: number;
  contentTerrain: Terrain;
  worldBossEligible: boolean;
}

interface TerrainClimate {
  elevation: number;
  moisture: number;
  temperature: number;
  corruption: number;
  ruggedness: number;
  dryness: number;
  distance: number;
}

const HEX_AXIAL_Y_SCALE = Math.sqrt(3) / 2;

const BIOME_SIGNAL_LAYERS = {
  elevation: [
    { scale: 9.5, weight: 0.5 },
    { scale: 4.75, weight: 0.3 },
    { scale: 2.3, weight: 0.2 },
  ],
  moisture: [
    { scale: 12, weight: 0.52 },
    { scale: 6, weight: 0.28 },
    { scale: 2.8, weight: 0.2 },
  ],
  temperature: [
    { scale: 13.5, weight: 0.5 },
    { scale: 6.5, weight: 0.3 },
    { scale: 3.1, weight: 0.2 },
  ],
  corruption: [
    { scale: 15, weight: 0.68 },
    { scale: 5.5, weight: 0.22 },
    { scale: 2.4, weight: 0.1 },
  ],
  ruggedness: [
    { scale: 7.2, weight: 0.46 },
    { scale: 3.4, weight: 0.34 },
    { scale: 1.7, weight: 0.2 },
  ],
} as const satisfies Record<
  'elevation' | 'moisture' | 'temperature' | 'corruption' | 'ruggedness',
  readonly NoiseLayer[]
>;

const TERRAIN_PROFILES = {
  plains: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  meadow: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  steppe: {
    biome: 'grassland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  grove: {
    biome: 'woodland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'forest',
    worldBossEligible: true,
  },
  forest: {
    biome: 'woodland',
    passable: true,
    tierBonus: 0,
    contentTerrain: 'forest',
    worldBossEligible: true,
  },
  marsh: {
    biome: 'wetland',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'swamp',
    worldBossEligible: false,
  },
  swamp: {
    biome: 'wetland',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'swamp',
    worldBossEligible: false,
  },
  dunes: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  desert: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  badlands: {
    biome: 'arid',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  highlands: {
    biome: 'alpine',
    passable: true,
    tierBonus: 1,
    contentTerrain: 'plains',
    worldBossEligible: false,
  },
  mountain: {
    biome: 'alpine',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'mountain',
    worldBossEligible: false,
  },
  blasted: {
    biome: 'corrupted',
    passable: true,
    tierBonus: 2,
    contentTerrain: 'desert',
    worldBossEligible: false,
  },
  rift: {
    biome: 'corrupted',
    passable: false,
    tierBonus: 2,
    contentTerrain: 'rift',
    worldBossEligible: false,
  },
} as const satisfies Record<Terrain, TerrainProfile>;

export function pickTerrain(seed: string, coord: HexCoord): Terrain {
  const climate = sampleTerrainClimate(seed, coord);
  const terrain = softenTerrainNearOrigin(
    resolveTerrainFromClimate(climate),
    climate.distance,
  );
  return terrain;
}

export function getTerrainProfile(terrain: Terrain) {
  return TERRAIN_PROFILES[terrain];
}

export function isPassableTerrain(terrain: Terrain) {
  return TERRAIN_PROFILES[terrain].passable;
}

export function getTerrainTierBonus(terrain: Terrain) {
  return TERRAIN_PROFILES[terrain].tierBonus;
}

export function getTerrainContentTerrain(terrain: Terrain): Terrain {
  return TERRAIN_PROFILES[terrain].contentTerrain;
}

export function isWorldBossTerrain(terrain: Terrain) {
  return TERRAIN_PROFILES[terrain].worldBossEligible;
}

function sampleTerrainClimate(seed: string, coord: HexCoord): TerrainClimate {
  const distance = hexDistance(coord, { q: 0, r: 0 });
  const elevation = sampleFractalNoise(
    `${seed}:terrain:elevation`,
    coord,
    BIOME_SIGNAL_LAYERS.elevation,
  );
  const moisture = sampleFractalNoise(
    `${seed}:terrain:moisture`,
    coord,
    BIOME_SIGNAL_LAYERS.moisture,
  );
  const temperature = sampleFractalNoise(
    `${seed}:terrain:temperature`,
    coord,
    BIOME_SIGNAL_LAYERS.temperature,
  );
  const corruption = clamp01(
    sampleFractalNoise(
      `${seed}:terrain:corruption`,
      coord,
      BIOME_SIGNAL_LAYERS.corruption,
    ) +
      Math.max(0, distance - 3) * 0.004,
  );
  const ruggedness = sampleFractalNoise(
    `${seed}:terrain:ruggedness`,
    coord,
    BIOME_SIGNAL_LAYERS.ruggedness,
  );
  const dryness = clamp01(
    (1 - moisture) * 0.68 +
      temperature * 0.32 +
      Math.max(0, ruggedness - 0.55) * 0.08,
  );

  return {
    elevation,
    moisture,
    temperature,
    corruption,
    ruggedness,
    dryness,
    distance,
  };
}

function resolveTerrainFromClimate(climate: TerrainClimate): Terrain {
  if (
    climate.corruption > 0.82 &&
    (climate.ruggedness > 0.54 || climate.elevation > 0.63)
  ) {
    return 'rift';
  }

  if (climate.elevation > 0.84 && climate.ruggedness > 0.5) {
    return 'mountain';
  }

  if (climate.corruption > 0.71 && climate.dryness > 0.46) {
    return 'blasted';
  }

  if (climate.elevation > 0.69) {
    return 'highlands';
  }

  if (climate.moisture > 0.76) {
    return climate.elevation < 0.48 ? 'swamp' : 'marsh';
  }

  if (climate.dryness > 0.83 && climate.ruggedness < 0.49) {
    return 'dunes';
  }

  if (climate.dryness > 0.69) {
    return climate.ruggedness > 0.57 ? 'badlands' : 'desert';
  }

  if (climate.moisture > 0.64) {
    return climate.ruggedness < 0.47 ? 'forest' : 'grove';
  }

  if (climate.moisture > 0.53) {
    return climate.ruggedness < 0.54 ? 'meadow' : 'grove';
  }

  if (climate.dryness > 0.56) {
    return 'steppe';
  }

  return 'plains';
}

function softenTerrainNearOrigin(terrain: Terrain, distance: number) {
  if (distance <= 1) {
    return 'plains';
  }

  if (distance <= 2) {
    switch (terrain) {
      case 'rift':
        return 'badlands';
      case 'mountain':
        return 'highlands';
      case 'blasted':
        return 'steppe';
      default:
        return terrain;
    }
  }

  if (distance <= 3 && terrain === 'rift') {
    return 'blasted';
  }

  return terrain;
}

function sampleFractalNoise(
  seed: string,
  coord: HexCoord,
  layers: readonly NoiseLayer[],
) {
  const point = axialToWorld(coord);
  const totalWeight = layers.reduce((sum, layer) => sum + layer.weight, 0);
  const value = layers.reduce(
    (sum, layer) =>
      sum +
      sampleInterpolatedNoise(
        seed,
        point.x / layer.scale,
        point.y / layer.scale,
      ) *
        layer.weight,
    0,
  );
  return clamp01(value / totalWeight);
}

function sampleInterpolatedNoise(seed: string, x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const top = lerp(latticeNoise(seed, x0, y0), latticeNoise(seed, x1, y0), tx);
  const bottom = lerp(
    latticeNoise(seed, x0, y1),
    latticeNoise(seed, x1, y1),
    tx,
  );
  return lerp(top, bottom, ty);
}

function latticeNoise(seed: string, x: number, y: number) {
  return createRng(`${seed}:${x}:${y}`)();
}

function axialToWorld(coord: HexCoord) {
  return {
    x: coord.q + coord.r * 0.5,
    y: coord.r * HEX_AXIAL_Y_SCALE,
  };
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
