import { TERRAIN_CHANCES } from './config';
import { hexDistance, type HexCoord } from './hex';
import { hashSeed } from './random';
import type { Terrain } from './types';

const ORIGIN = { q: 0, r: 0 } as const;
const HEX_TO_WORLD_X = Math.sqrt(3);
const HEX_TO_WORLD_Y = 1.5;
const BIOME_OCTAVES = 3;
const BIOME_PERSISTENCE = 0.46;
const BIOME_LACUNARITY = 0.64;
const ELEVATION_SCALE = 13.5;
const ELEVATION_REGION_SCALE = 24.5;
const MOISTURE_SCALE = 14.5;
const MOISTURE_REGION_SCALE = 26.5;
const HEAT_SCALE = 15.5;
const HEAT_REGION_SCALE = 28.5;
const RUGGEDNESS_SCALE = 11.5;
const RUGGEDNESS_REGION_SCALE = 18.5;
const CORRUPTION_SCALE = 20.5;
const CORRUPTION_REGION_SCALE = 26.5;

export interface WorldBiomeFields {
  corruption: number;
  elevation: number;
  heat: number;
  moisture: number;
  ruggedness: number;
}

export function pickWorldTerrain(seed: string, coord: HexCoord): Terrain {
  if (hexDistance(coord, ORIGIN) <= 1) {
    return 'plains';
  }

  const fields = getWorldBiomeFields(seed, coord);
  const coldness = 1 - fields.heat;
  const passableScores = {
    desert:
      TERRAIN_CHANCES.desert +
      favorHigh(fields.heat, 0.66) * 1.02 +
      favorLow(fields.moisture, 0.34) * 1.24 +
      favorBand(fields.elevation, 0.46, 0.34) * 0.22 +
      favorLow(fields.ruggedness, 0.72) * 0.08,
    forest:
      TERRAIN_CHANCES.forest +
      favorHigh(fields.moisture, 0.56) * 1.18 +
      favorBand(fields.heat, 0.48, 0.28) * 0.82 +
      favorLow(fields.ruggedness, 0.6) * 0.18 +
      favorBand(fields.elevation, 0.48, 0.28) * 0.14,
    tundra:
      TERRAIN_CHANCES.tundra +
      favorHigh(coldness, 0.62) * 1.28 +
      favorBand(fields.moisture, 0.44, 0.28) * 0.34 +
      favorBand(fields.elevation, 0.54, 0.3) * 0.28,
    highlands:
      TERRAIN_CHANCES.highlands +
      favorHigh(fields.elevation, 0.57) * 1.26 +
      favorHigh(fields.ruggedness, 0.54) * 0.9 +
      favorBand(fields.heat, 0.42, 0.32) * 0.18,
    badlands:
      TERRAIN_CHANCES.badlands +
      favorHigh(fields.heat, 0.58) * 0.48 +
      favorLow(fields.moisture, 0.36) * 1.18 +
      favorHigh(fields.ruggedness, 0.52) * 0.98 +
      favorBand(fields.elevation, 0.58, 0.26) * 0.22,
    plains:
      TERRAIN_CHANCES.plains +
      favorBand(fields.moisture, 0.5, 0.26) * 0.42 +
      favorBand(fields.heat, 0.54, 0.24) * 0.36 +
      favorLow(fields.ruggedness, 0.68) * 0.14,
    swamp:
      TERRAIN_CHANCES.swamp +
      favorHigh(fields.moisture, 0.72) * 1.28 +
      favorLow(fields.elevation, 0.42) * 1.12 +
      favorBand(fields.heat, 0.6, 0.28) * 0.34,
  } as const satisfies Record<Exclude<Terrain, 'mountain' | 'rift'>, number>;

  const baseTerrain = maxTerrainScore(passableScores);
  let winningTerrain: Terrain = baseTerrain;
  let score = passableScores[baseTerrain];

  const mountainUnlocked = fields.elevation > 0.72 && fields.ruggedness > 0.64;
  if (mountainUnlocked) {
    const mountainScore =
      TERRAIN_CHANCES.mountain * 0.16 +
      favorHigh(fields.elevation, 0.72) * 1.44 +
      favorHigh(fields.ruggedness, 0.64) * 1.12 +
      favorLow(fields.moisture, 0.46) * 0.14;

    if (mountainScore > score) {
      winningTerrain = 'mountain';
      score = mountainScore;
    }
  }

  const riftUnlocked = fields.corruption > 0.82 && fields.ruggedness > 0.5;
  if (riftUnlocked) {
    const riftScore =
      TERRAIN_CHANCES.rift * 0.14 +
      favorHigh(fields.corruption, 0.82) * 2.12 +
      favorHigh(fields.ruggedness, 0.5) * 0.28 +
      favorBand(fields.elevation, 0.56, 0.24) * 0.1;

    if (riftScore > score) {
      return 'rift';
    }
  }

  return winningTerrain;
}

export function getWorldBiomeFields(
  seed: string,
  coord: HexCoord,
): WorldBiomeFields {
  const worldPoint = axialToWorldPoint(coord);
  const elevationSeed = hashSeed(`${seed}:world-biome:elevation`);
  const moistureSeed = hashSeed(`${seed}:world-biome:moisture`);
  const heatSeed = hashSeed(`${seed}:world-biome:heat`);
  const ruggednessSeed = hashSeed(`${seed}:world-biome:ruggedness`);
  const corruptionSeed = hashSeed(`${seed}:world-biome:corruption`);

  let elevation = mixFields(
    sampleFractalValueNoise(
      elevationSeed,
      worldPoint.x,
      worldPoint.y,
      ELEVATION_REGION_SCALE,
    ),
    sampleFractalValueNoise(
      elevationSeed ^ 0x2196f3,
      worldPoint.x,
      worldPoint.y,
      ELEVATION_SCALE,
    ),
    0.6,
  );
  let moisture = mixFields(
    sampleFractalValueNoise(
      moistureSeed,
      worldPoint.x,
      worldPoint.y,
      MOISTURE_REGION_SCALE,
    ),
    sampleFractalValueNoise(
      moistureSeed ^ 0x2e7d32,
      worldPoint.x,
      worldPoint.y,
      MOISTURE_SCALE,
    ),
    0.58,
  );
  let heat =
    sampleFractalValueNoise(
      heatSeed,
      worldPoint.x,
      worldPoint.y,
      HEAT_REGION_SCALE,
    ) *
      0.46 +
    sampleFractalValueNoise(
      heatSeed ^ 0x7f4a7c15,
      worldPoint.x,
      worldPoint.y,
      HEAT_SCALE,
    ) *
      0.36 +
    sampleValueNoise(
      heatSeed ^ 0x55aa0ff1,
      worldPoint.x,
      worldPoint.y,
      HEAT_SCALE * 0.62,
    ) *
      0.18;
  let ruggedness = mixFields(
    sampleRidgedNoise(
      ruggednessSeed,
      worldPoint.x,
      worldPoint.y,
      RUGGEDNESS_REGION_SCALE,
    ),
    sampleRidgedNoise(
      ruggednessSeed ^ 0x6a1b9a,
      worldPoint.x,
      worldPoint.y,
      RUGGEDNESS_SCALE,
    ),
    0.5,
  );
  let corruption =
    sampleRidgedNoise(
      corruptionSeed,
      worldPoint.x,
      worldPoint.y,
      CORRUPTION_REGION_SCALE,
    ) *
      0.48 +
    sampleRidgedNoise(
      corruptionSeed ^ 0x68bc21eb,
      worldPoint.x,
      worldPoint.y,
      CORRUPTION_SCALE,
    ) *
      0.32 +
    sampleFractalValueNoise(
      corruptionSeed ^ 0x4b0082,
      worldPoint.x,
      worldPoint.y,
      CORRUPTION_SCALE * 0.74,
    ) *
      0.2;
  const heatDrift = clamp01(
    normalizeAxis(worldPoint.x * 0.74 - worldPoint.y * 0.42, 10.5) * 0.72 +
      normalizeAxis(worldPoint.x * -0.18 + worldPoint.y * 0.64, 12.5) * 0.28,
  );
  const moistureDrift = clamp01(
    normalizeAxis(worldPoint.x * -0.58 - worldPoint.y * 0.48, 10.5) * 0.7 +
      normalizeAxis(worldPoint.x * 0.22 + worldPoint.y * 0.62, 12.5) * 0.3,
  );
  const elevationSpine =
    1 -
    Math.abs(
      normalizeAxis(worldPoint.x * 0.18 + worldPoint.y * 0.82, 10.5) - 0.5,
    ) *
      2;
  const elevationDrift = clamp01(
    elevationSpine * 0.76 +
      normalizeAxis(worldPoint.x * 0.66 - worldPoint.y * 0.22, 12.5) * 0.24,
  );
  const corruptionDrift = normalizeAxis(
    worldPoint.x * 0.18 - worldPoint.y * 0.64,
    10.5,
  );

  elevation = clamp01(elevation * 0.56 + elevationDrift * 0.44);
  moisture = clamp01(moisture * 0.58 + moistureDrift * 0.42);
  heat = clamp01(heat * 0.56 + heatDrift * 0.44);
  ruggedness = clamp01(ruggedness * 0.78 + elevationDrift * 0.22);
  corruption = clamp01(corruption * 0.72 + corruptionDrift * 0.28);

  elevation = stretchField(elevation, 1.82);
  moisture = stretchField(moisture, 1.78);
  heat = stretchField(heat, 1.84);
  ruggedness = stretchField(ruggedness, 1.72);
  corruption = stretchField(corruption, 1.48);

  return {
    corruption: clamp01(corruption),
    elevation: clamp01(elevation),
    heat: clamp01(heat),
    moisture: clamp01(moisture),
    ruggedness: clamp01(ruggedness),
  };
}

function axialToWorldPoint(coord: HexCoord) {
  return {
    x: HEX_TO_WORLD_X * (coord.q + coord.r / 2),
    y: HEX_TO_WORLD_Y * coord.r,
  };
}

function sampleFractalValueNoise(
  seedHash: number,
  x: number,
  y: number,
  scale: number,
) {
  let amplitude = 1;
  let frequencyScale = scale;
  let total = 0;
  let totalAmplitude = 0;

  for (let octave = 0; octave < BIOME_OCTAVES; octave += 1) {
    total +=
      sampleValueNoise(
        seedHash ^ Math.imul(octave + 1, 0x45d9f3b),
        x,
        y,
        Math.max(1.2, frequencyScale),
      ) * amplitude;
    totalAmplitude += amplitude;
    amplitude *= BIOME_PERSISTENCE;
    frequencyScale *= BIOME_LACUNARITY;
  }

  return total / Math.max(0.0001, totalAmplitude);
}

function sampleRidgedNoise(
  seedHash: number,
  x: number,
  y: number,
  scale: number,
) {
  const smooth = sampleFractalValueNoise(seedHash, x, y, scale);
  const ridged = 1 - Math.abs(smooth * 2 - 1);
  return clamp01(1 - ridged);
}

function sampleValueNoise(
  seedHash: number,
  x: number,
  y: number,
  scale: number,
) {
  const sampleX = x / scale;
  const sampleY = y / scale;
  const x0 = Math.floor(sampleX);
  const y0 = Math.floor(sampleY);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = smoothstep(sampleX - x0);
  const ty = smoothstep(sampleY - y0);
  const top = lerp(
    gridNoise(seedHash, x0, y0),
    gridNoise(seedHash, x1, y0),
    tx,
  );
  const bottom = lerp(
    gridNoise(seedHash, x0, y1),
    gridNoise(seedHash, x1, y1),
    tx,
  );

  return lerp(top, bottom, ty);
}

function gridNoise(seedHash: number, x: number, y: number) {
  let hash = seedHash;
  hash = Math.imul(hash ^ (x + 0x9e3779b9), 0x85ebca6b);
  hash = Math.imul(hash ^ (y + 0xc2b2ae35), 0x27d4eb2d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x165667b1);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 4294967296;
}

function favorBand(value: number, center: number, width: number) {
  if (width <= 0) {
    return 0;
  }

  const distance = Math.abs(value - center) / width;
  if (distance >= 1) {
    return 0;
  }

  const normalized = 1 - distance;
  return normalized * normalized;
}

function favorHigh(value: number, threshold: number) {
  if (threshold >= 1) {
    return 0;
  }

  return smoothstep((value - threshold) / (1 - threshold));
}

function favorLow(value: number, threshold: number) {
  if (threshold <= 0) {
    return 0;
  }

  return 1 - smoothstep(value / threshold);
}

function smoothstep(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizeAxis(value: number, span: number) {
  if (span <= 0) {
    return 0.5;
  }

  return clamp01(value / (span * 2) + 0.5);
}

function mixFields(
  regionValue: number,
  detailValue: number,
  regionWeight: number,
) {
  const clampedWeight = clamp01(regionWeight);
  return regionValue * clampedWeight + detailValue * (1 - clampedWeight);
}

function stretchField(value: number, amount: number) {
  return clamp01(0.5 + (value - 0.5) * amount);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function maxTerrainScore<T extends string>(scores: Record<T, number>) {
  return (Object.entries(scores) as Array<[T, number]>).reduce((best, entry) =>
    entry[1] > best[1] ? entry : best,
  )[0];
}
