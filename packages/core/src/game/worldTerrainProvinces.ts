import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { createRng } from './random';

const BASE_PROVINCE_WIDTH = 5;
const BASE_PROVINCE_HEIGHT = 5;
const OUTER_PROVINCE_DISTANCE_THRESHOLD = 14;
const OUTER_PROVINCE_GROUP_WIDTH = 2;
const OUTER_PROVINCE_GROUP_HEIGHT = 3;
const OUTER_PROVINCE_Q_OFFSET = 0;
const OUTER_PROVINCE_R_OFFSET = 1;

export interface TerrainProvince {
  id: string;
  center: HexCoord;
  members: HexCoord[];
}

interface BaseProvinceCell {
  provinceQ: number;
  provinceR: number;
  startQ: number;
  startR: number;
  center: HexCoord;
}

const provinceCache = new Map<string, TerrainProvince>();
const provinceOffsetCache = new Map<string, { q: number; r: number }>();

export function getTerrainProvinceAt(
  seed: string,
  coord: HexCoord,
): TerrainProvince {
  const baseCell = getBaseProvinceCell(seed, coord);
  const definition = getProvinceDefinition(seed, baseCell);
  const cached = provinceCache.get(definition.id);
  if (cached) {
    return cached;
  }

  const province = {
    id: definition.id,
    center: pickProvinceCenter(definition.cells),
    members: definition.cells.flatMap((cell) => getBaseProvinceMembers(cell)),
  } satisfies TerrainProvince;

  provinceCache.set(definition.id, province);
  return province;
}

export function buildTerrainProvinceMap(
  seed: string,
  coords: readonly HexCoord[],
) {
  const provinceById = new Map<string, TerrainProvince>();

  for (const coord of coords) {
    const runtimeProvince = getTerrainProvinceAt(seed, coord);
    const sampledProvince = provinceById.get(runtimeProvince.id);
    if (sampledProvince) {
      sampledProvince.members.push(coord);
      continue;
    }

    provinceById.set(runtimeProvince.id, {
      id: runtimeProvince.id,
      center: runtimeProvince.center,
      members: [coord],
    });
  }

  return [...provinceById.values()]
    .map((province) => ({
      ...province,
      members: province.members.sort(compareCoords),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function buildSampledTerrainProvinceMap(
  seed: string,
  coords: readonly HexCoord[],
) {
  const sampledProvinces = buildTerrainProvinceMap(seed, coords).map(
    (province) => ({
      id: province.id,
      center: province.center,
      members: [...province.members],
      sourceIds: [province.id],
    }),
  );

  const mergedProvinces = new Map(
    sampledProvinces.map((province) => [province.id, province]),
  );

  while (true) {
    const smallestProvince = [...mergedProvinces.values()]
      .filter(
        (province) => province.members.length < MINIMUM_SAMPLED_PROVINCE_SIZE,
      )
      .sort(compareSampledProvinceSizeThenId)[0];

    if (!smallestProvince) {
      break;
    }

    const mergeTarget = pickSampledMergeTarget(
      mergedProvinces,
      smallestProvince.id,
    );
    if (!mergeTarget) {
      break;
    }

    const previousMergeTargetId = mergeTarget.id;
    mergeTarget.members.push(...smallestProvince.members);
    mergeTarget.sourceIds.push(...smallestProvince.sourceIds);
    mergeTarget.id = formatSampledProvinceId(seed, mergeTarget.sourceIds);
    mergeTarget.center = pickSampledProvinceCenter(mergeTarget.members);
    mergedProvinces.delete(smallestProvince.id);
    mergedProvinces.delete(previousMergeTargetId);
    mergedProvinces.set(mergeTarget.id, mergeTarget);
  }

  return [...mergedProvinces.values()]
    .map((province) => ({
      id: province.id,
      center: province.center,
      members: dedupeCoords(province.members),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function getProvinceDefinition(seed: string, baseCell: BaseProvinceCell) {
  if (!isOuterProvinceCell(baseCell)) {
    return {
      id: `${seed}:terrain:province:${baseCell.provinceQ}:${baseCell.provinceR}`,
      cells: [baseCell],
    };
  }

  const groupQ = Math.floor(
    (baseCell.provinceQ + OUTER_PROVINCE_Q_OFFSET) / OUTER_PROVINCE_GROUP_WIDTH,
  );
  const groupR = Math.floor(
    (baseCell.provinceR + OUTER_PROVINCE_R_OFFSET) /
      OUTER_PROVINCE_GROUP_HEIGHT,
  );
  const cells: BaseProvinceCell[] = [];

  for (let q = 0; q < OUTER_PROVINCE_GROUP_WIDTH; q += 1) {
    for (let r = 0; r < OUTER_PROVINCE_GROUP_HEIGHT; r += 1) {
      const candidateCell = getBaseProvinceCellFromPartition(
        seed,
        groupQ * OUTER_PROVINCE_GROUP_WIDTH - OUTER_PROVINCE_Q_OFFSET + q,
        groupR * OUTER_PROVINCE_GROUP_HEIGHT - OUTER_PROVINCE_R_OFFSET + r,
      );
      if (isOuterProvinceCell(candidateCell)) {
        cells.push(candidateCell);
      }
    }
  }

  return {
    id: `${seed}:terrain:province:outer:${groupQ}:${groupR}`,
    cells,
  };
}

function isOuterProvinceCell(cell: BaseProvinceCell) {
  return (
    hexDistance(cell.center, { q: 0, r: 0 }) >=
    OUTER_PROVINCE_DISTANCE_THRESHOLD
  );
}

function getBaseProvinceCell(seed: string, coord: HexCoord): BaseProvinceCell {
  const offsets = getProvinceOffsets(seed);
  const provinceQ = Math.floor((coord.q + offsets.q) / BASE_PROVINCE_WIDTH);
  const provinceR = Math.floor((coord.r + offsets.r) / BASE_PROVINCE_HEIGHT);
  return getBaseProvinceCellFromPartition(seed, provinceQ, provinceR);
}

function getBaseProvinceCellFromPartition(
  seed: string,
  provinceQ: number,
  provinceR: number,
): BaseProvinceCell {
  const offsets = getProvinceOffsets(seed);
  const startQ = provinceQ * BASE_PROVINCE_WIDTH - offsets.q;
  const startR = provinceR * BASE_PROVINCE_HEIGHT - offsets.r;

  return {
    provinceQ,
    provinceR,
    startQ,
    startR,
    center: {
      q: startQ + Math.floor(BASE_PROVINCE_WIDTH / 2),
      r: startR + Math.floor(BASE_PROVINCE_HEIGHT / 2),
    },
  };
}

function getBaseProvinceMembers(cell: BaseProvinceCell) {
  const members: HexCoord[] = [];

  for (let q = 0; q < BASE_PROVINCE_WIDTH; q += 1) {
    for (let r = 0; r < BASE_PROVINCE_HEIGHT; r += 1) {
      members.push({ q: cell.startQ + q, r: cell.startR + r });
    }
  }

  return members;
}

function pickProvinceCenter(cells: readonly BaseProvinceCell[]) {
  const sortedCells = [...cells].sort((left, right) => {
    const leftDistance = hexDistance(left.center, { q: 0, r: 0 });
    const rightDistance = hexDistance(right.center, { q: 0, r: 0 });
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return compareCoords(left.center, right.center);
  });

  return sortedCells[Math.floor(sortedCells.length / 2)]!.center;
}

function getProvinceOffsets(seed: string) {
  const cached = provinceOffsetCache.get(seed);
  if (cached) {
    return cached;
  }

  const rng = createRng(`${seed}:terrain:province:offsets`);
  const offsets = {
    q: Math.floor(rng() * BASE_PROVINCE_WIDTH),
    r: Math.floor(rng() * BASE_PROVINCE_HEIGHT),
  };

  provinceOffsetCache.set(seed, offsets);
  return offsets;
}

function compareCoords(left: HexCoord, right: HexCoord) {
  if (left.q !== right.q) {
    return left.q - right.q;
  }

  return left.r - right.r;
}

const MINIMUM_SAMPLED_PROVINCE_SIZE = 20;

interface SampledTerrainProvince extends TerrainProvince {
  sourceIds: string[];
}

function pickSampledMergeTarget(
  provinces: Map<string, SampledTerrainProvince>,
  provinceId: string,
) {
  const province = provinces.get(provinceId);
  if (!province) {
    return null;
  }

  const provinceByCoordKey = new Map<string, SampledTerrainProvince>();
  for (const candidate of provinces.values()) {
    for (const coord of candidate.members) {
      provinceByCoordKey.set(hexKey(coord), candidate);
    }
  }

  const borderCounts = new Map<string, number>();
  for (const coord of province.members) {
    for (const neighbor of hexNeighbors(coord)) {
      const neighborProvince = provinceByCoordKey.get(hexKey(neighbor));
      if (!neighborProvince || neighborProvince.id === province.id) {
        continue;
      }

      borderCounts.set(
        neighborProvince.id,
        (borderCounts.get(neighborProvince.id) ?? 0) + 1,
      );
    }
  }

  return (
    [...borderCounts.entries()]
      .map(([neighborId, borderCount]) => ({
        province: provinces.get(neighborId)!,
        borderCount,
      }))
      .sort((left, right) => {
        if (right.borderCount !== left.borderCount) {
          return right.borderCount - left.borderCount;
        }

        if (right.province.members.length !== left.province.members.length) {
          return right.province.members.length - left.province.members.length;
        }

        return left.province.id.localeCompare(right.province.id);
      })[0]?.province ?? null
  );
}

function compareSampledProvinceSizeThenId(
  left: SampledTerrainProvince,
  right: SampledTerrainProvince,
) {
  if (left.members.length !== right.members.length) {
    return left.members.length - right.members.length;
  }

  return left.id.localeCompare(right.id);
}

function formatSampledProvinceId(seed: string, sourceIds: readonly string[]) {
  return `${seed}:terrain:sampled-province:${[...new Set(sourceIds)].sort().join('|')}`;
}

function pickSampledProvinceCenter(coords: readonly HexCoord[]) {
  return [...coords].sort(compareCoords)[Math.floor(coords.length / 2)]!;
}

function dedupeCoords(coords: readonly HexCoord[]) {
  const coordByKey = new Map<string, HexCoord>();
  for (const coord of coords) {
    coordByKey.set(hexKey(coord), coord);
  }

  return [...coordByKey.values()].sort(compareCoords);
}
