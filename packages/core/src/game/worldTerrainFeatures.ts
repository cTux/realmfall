import { hexKey, type HexCoord } from './hex';
import { createRng } from './random';

export interface TerrainFeatureStamp {
  featureId: string;
  terrain: 'mountain' | 'rift';
  coord: HexCoord;
  connectivity: 'isolated' | 'end' | 'straight' | 'bend' | 'fork' | 'massif';
}

interface FeatureBlockSpec {
  blockSize: number;
  minLength: number;
  lengthRange: number;
  branchChance: number;
  widthChance: number;
}

const FEATURE_SPECS: Record<TerrainFeatureStamp['terrain'], FeatureBlockSpec> =
  {
    mountain: {
      blockSize: 14,
      minLength: 6,
      lengthRange: 4,
      branchChance: 0.55,
      widthChance: 0.42,
    },
    rift: {
      blockSize: 16,
      minLength: 5,
      lengthRange: 3,
      branchChance: 0.4,
      widthChance: 0,
    },
  };

const featureOffsetCache = new Map<string, { q: number; r: number }>();
const featureBlockCache = new Map<string, TerrainFeatureStamp[]>();

export function getMacroTerrainFeatureAt(seed: string, coord: HexCoord) {
  return (
    buildMacroTerrainFeatures(seed, [coord]).find(
      (feature) => feature.coord.q === coord.q && feature.coord.r === coord.r,
    ) ?? null
  );
}

export function buildMacroTerrainFeatures(
  seed: string,
  coords: readonly HexCoord[],
) {
  if (coords.length === 0) {
    return [];
  }

  const coordKeys = new Set(coords.map((coord) => hexKey(coord)));
  const featureByKey = new Map<string, TerrainFeatureStamp>();

  for (const terrain of ['mountain', 'rift'] as const) {
    const blocks = collectRelevantBlocks(seed, coords, terrain);

    for (const block of blocks) {
      const featureId = `${seed}:terrain:feature:${terrain}:${block.q}:${block.r}`;
      for (const feature of getFeatureBlock(seed, terrain, block.q, block.r)) {
        const key = hexKey(feature.coord);
        if (!coordKeys.has(key)) {
          continue;
        }

        const existing = featureByKey.get(key);
        if (!existing || terrain === 'rift') {
          featureByKey.set(key, { ...feature, featureId });
        }
      }
    }
  }

  return [...featureByKey.values()];
}

function collectRelevantBlocks(
  seed: string,
  coords: readonly HexCoord[],
  terrain: TerrainFeatureStamp['terrain'],
) {
  const spec = FEATURE_SPECS[terrain];
  const offsets = getFeatureOffsets(seed, terrain);
  const blocks = new Map<string, { q: number; r: number }>();

  for (const coord of coords) {
    const blockQ = Math.floor((coord.q + offsets.q) / spec.blockSize);
    const blockR = Math.floor((coord.r + offsets.r) / spec.blockSize);

    for (let q = blockQ - 1; q <= blockQ + 1; q += 1) {
      for (let r = blockR - 1; r <= blockR + 1; r += 1) {
        blocks.set(`${q},${r}`, { q, r });
      }
    }
  }

  return [...blocks.values()];
}

function getFeatureBlock(
  seed: string,
  terrain: TerrainFeatureStamp['terrain'],
  blockQ: number,
  blockR: number,
) {
  const cacheKey = `${seed}:terrain:feature-block:${terrain}:${blockQ}:${blockR}`;
  const cached = featureBlockCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const spec = FEATURE_SPECS[terrain];
  const offsets = getFeatureOffsets(seed, terrain);
  const rng = createRng(cacheKey);
  const blockStartQ = blockQ * spec.blockSize - offsets.q;
  const blockStartR = blockR * spec.blockSize - offsets.r;
  const start = {
    q: blockStartQ + 2 + Math.floor(rng() * (spec.blockSize - 4)),
    r: blockStartR + 2 + Math.floor(rng() * (spec.blockSize - 4)),
  } satisfies HexCoord;
  const mainDirectionIndex = Math.floor(rng() * HEX_DIRECTIONS.length);
  const turnDirection = rng() < 0.5 ? -1 : 1;
  const turnStart = 2 + Math.floor(rng() * 2);
  const length = spec.minLength + Math.floor(rng() * spec.lengthRange);
  const coords = new Map<string, HexCoord>();
  const path: HexCoord[] = [start];
  let current = start;

  coords.set(hexKey(start), start);

  for (let step = 1; step < length; step += 1) {
    const direction =
      step >= turnStart
        ? HEX_DIRECTIONS[
            wrapDirectionIndex(mainDirectionIndex + turnDirection)
          ]!
        : HEX_DIRECTIONS[mainDirectionIndex]!;
    current = moveCoord(current, direction);
    path.push(current);
    coords.set(hexKey(current), current);
  }

  if (rng() < spec.branchChance) {
    const branchOrigin = path[Math.floor(path.length / 2)] ?? path[0]!;
    const branchDirection =
      HEX_DIRECTIONS[wrapDirectionIndex(mainDirectionIndex - turnDirection)]!;
    let branchCoord = branchOrigin;
    const branchLength = terrain === 'mountain' ? 3 : 2;

    for (let step = 0; step < branchLength; step += 1) {
      branchCoord = moveCoord(branchCoord, branchDirection);
      coords.set(hexKey(branchCoord), branchCoord);
    }
  }

  if (terrain === 'mountain' && rng() < spec.widthChance) {
    const massifOrigin = path[Math.floor(path.length / 2)] ?? path[0]!;
    const leftDirection =
      HEX_DIRECTIONS[wrapDirectionIndex(mainDirectionIndex - 1)]!;
    const rightDirection =
      HEX_DIRECTIONS[wrapDirectionIndex(mainDirectionIndex + 1)]!;
    const leftShoulder = moveCoord(massifOrigin, leftDirection);
    const rightShoulder = moveCoord(massifOrigin, rightDirection);

    coords.set(hexKey(leftShoulder), leftShoulder);
    coords.set(hexKey(rightShoulder), rightShoulder);
  }

  const coordList = [...coords.values()];
  const stampByKey = new Map<string, TerrainFeatureStamp>();

  for (const coord of coordList) {
    stampByKey.set(hexKey(coord), {
      featureId: `${seed}:terrain:feature:${terrain}:${blockQ}:${blockR}`,
      terrain,
      coord,
      connectivity: 'isolated',
    });
  }

  for (const stamp of stampByKey.values()) {
    stamp.connectivity = classifyConnectivity(stamp.coord, stampByKey);
  }

  const result = [...stampByKey.values()];
  featureBlockCache.set(cacheKey, result);
  return result;
}

function getFeatureOffsets(
  seed: string,
  terrain: TerrainFeatureStamp['terrain'],
) {
  const cacheKey = `${seed}:${terrain}`;
  const cached = featureOffsetCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const blockSize = FEATURE_SPECS[terrain].blockSize;
  const rng = createRng(`${seed}:terrain:feature-offsets:${terrain}`);
  const offsets = {
    q: Math.floor(rng() * blockSize),
    r: Math.floor(rng() * blockSize),
  };

  featureOffsetCache.set(cacheKey, offsets);
  return offsets;
}

function moveCoord(coord: HexCoord, direction: HexCoord) {
  return {
    q: coord.q + direction.q,
    r: coord.r + direction.r,
  };
}

function classifyConnectivity(
  coord: HexCoord,
  featureByKey: Map<string, TerrainFeatureStamp>,
) {
  const connectedDirections = HEX_DIRECTIONS.filter((direction) =>
    featureByKey.has(hexKey(moveCoord(coord, direction))),
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

  const firstIndex = directionIndex(firstDirection);
  const secondIndex = directionIndex(secondDirection);
  return Math.abs(firstIndex - secondIndex) === 3 ? 'straight' : 'bend';
}

function directionIndex(direction: HexCoord) {
  return HEX_DIRECTIONS.findIndex(
    (entry) => entry.q === direction.q && entry.r === direction.r,
  );
}

function wrapDirectionIndex(index: number) {
  return (index + HEX_DIRECTIONS.length) % HEX_DIRECTIONS.length;
}

const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const satisfies readonly HexCoord[];
