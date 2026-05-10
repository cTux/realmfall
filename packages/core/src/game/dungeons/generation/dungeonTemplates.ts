import { hexDistance, hexKey, hexesInRange, type HexCoord } from '../../hex';
import { createRng } from '../../random';
import type { DungeonTemplateId } from '../types';

export const DUNGEON_TEMPLATE_WEIGHTS: ReadonlyArray<{
  id: DungeonTemplateId;
  weight: number;
}> = [
  { id: 'rooms-and-corridors', weight: 6 },
  { id: 'branching-spine', weight: 3 },
  { id: 'dense-maze', weight: 2 },
];

const ORIGIN: HexCoord = { q: 0, r: 0 };
const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

const TARGET_PASSABLE_TILES: Record<DungeonTemplateId, number> = {
  'rooms-and-corridors': 224,
  'branching-spine': 230,
  'dense-maze': 236,
};

type PassableMap = Map<string, HexCoord>;

export function pickDungeonTemplateId(seed: string) {
  const totalWeight = DUNGEON_TEMPLATE_WEIGHTS.reduce(
    (sum, template) => sum + template.weight,
    0,
  );
  let cursor = createRng(`${seed}:template`)() * totalWeight;

  for (const template of DUNGEON_TEMPLATE_WEIGHTS) {
    cursor -= template.weight;
    if (cursor <= 0) {
      return template.id;
    }
  }

  return DUNGEON_TEMPLATE_WEIGHTS[0]!.id;
}

export function buildDungeonPassableCoords(
  templateId: DungeonTemplateId,
  seed: string,
) {
  const layout = {
    'rooms-and-corridors': buildRoomsAndCorridors,
    'branching-spine': buildBranchingSpine,
    'dense-maze': buildDenseMaze,
  }[templateId](seed);

  return Array.from(layout.values()).sort(compareCoords);
}

function buildRoomsAndCorridors(seed: string) {
  const rng = createRng(`${seed}:rooms-and-corridors`);
  const passable = new Map<string, HexCoord>();
  const roomCenters: HexCoord[] = [ORIGIN];

  addRoom(passable, ORIGIN, 2);

  let stalledAttempts = 0;
  while (
    passable.size < TARGET_PASSABLE_TILES['rooms-and-corridors'] &&
    stalledAttempts < 120
  ) {
    const anchor = pickArrayValue(roomCenters, rng) ?? ORIGIN;
    const directionIndex = Math.floor(rng() * HEX_DIRECTIONS.length);
    const corridorLength = 2 + Math.floor(rng() * 2);
    const roomRadius = rng() < 0.7 ? 2 : 1;
    const nextCenter = translateCoord(
      anchor,
      HEX_DIRECTIONS[directionIndex]!,
      corridorLength + 1,
    );

    if (
      hexDistance(nextCenter, ORIGIN) > 11 ||
      roomCenters.some((center) => hexDistance(center, nextCenter) < 2)
    ) {
      stalledAttempts += 1;
      continue;
    }

    carveStraightPath(
      passable,
      anchor,
      HEX_DIRECTIONS[directionIndex]!,
      corridorLength,
    );
    addRoom(passable, nextCenter, roomRadius);
    roomCenters.push(nextCenter);

    if (rng() < 0.45) {
      const branchDirectionIndex = rotateDirectionIndex(
        directionIndex,
        rng() < 0.5 ? 2 : -2,
      );
      const branchLength = 1 + Math.floor(rng() * 2);
      const branchCenter = translateCoord(
        nextCenter,
        HEX_DIRECTIONS[branchDirectionIndex]!,
        branchLength + 1,
      );

      if (hexDistance(branchCenter, ORIGIN) <= 11) {
        carveStraightPath(
          passable,
          nextCenter,
          HEX_DIRECTIONS[branchDirectionIndex]!,
          branchLength,
        );
        addRoom(passable, branchCenter, 1);
        roomCenters.push(branchCenter);
      }
    }

    stalledAttempts = 0;
  }

  fillWithNeighborGrowth(
    passable,
    rng,
    TARGET_PASSABLE_TILES['rooms-and-corridors'],
    12,
    0.12,
  );
  return passable;
}

function buildBranchingSpine(seed: string) {
  const rng = createRng(`${seed}:branching-spine`);
  const passable = new Map<string, HexCoord>();
  const spineNodes: HexCoord[] = [ORIGIN];
  const spineDirections: number[] = [];

  addRoom(passable, ORIGIN, 2);

  let cursor = ORIGIN;
  let directionIndex = Math.floor(rng() * HEX_DIRECTIONS.length);
  let stalledAttempts = 0;

  while (spineNodes.length < 12 && stalledAttempts < 80) {
    const driftRoll = rng();
    const drift = driftRoll < 0.34 ? -1 : driftRoll < 0.68 ? 0 : 1;
    directionIndex = rotateDirectionIndex(directionIndex, drift);

    const corridorLength = 2 + Math.floor(rng() * 2);
    const nextCenter = translateCoord(
      cursor,
      HEX_DIRECTIONS[directionIndex]!,
      corridorLength + 1,
    );

    if (hexDistance(nextCenter, ORIGIN) > 12) {
      directionIndex = rotateDirectionIndex(directionIndex, 3);
      stalledAttempts += 1;
      continue;
    }

    carveStraightPath(
      passable,
      cursor,
      HEX_DIRECTIONS[directionIndex]!,
      corridorLength,
    );
    addRoom(passable, nextCenter, rng() < 0.55 ? 1 : 2);

    cursor = nextCenter;
    spineNodes.push(nextCenter);
    spineDirections.push(directionIndex);
    stalledAttempts = 0;
  }

  stalledAttempts = 0;
  while (
    passable.size < TARGET_PASSABLE_TILES['branching-spine'] &&
    stalledAttempts < 160
  ) {
    const nodeIndex =
      Math.floor(rng() * Math.max(1, spineNodes.length - 1)) + 1;
    const anchor = spineNodes[nodeIndex] ?? spineNodes[spineNodes.length - 1]!;
    const baseDirection =
      spineDirections[
        Math.max(0, Math.min(nodeIndex - 1, spineDirections.length - 1))
      ] ?? directionIndex;
    const branchDirectionIndex = rotateDirectionIndex(
      baseDirection,
      rng() < 0.5 ? 2 : -2,
    );
    const corridorLength = 1 + Math.floor(rng() * 3);
    const branchCenter = translateCoord(
      anchor,
      HEX_DIRECTIONS[branchDirectionIndex]!,
      corridorLength + 1,
    );

    if (hexDistance(branchCenter, ORIGIN) > 12) {
      stalledAttempts += 1;
      continue;
    }

    carveStraightPath(
      passable,
      anchor,
      HEX_DIRECTIONS[branchDirectionIndex]!,
      corridorLength,
    );
    addRoom(passable, branchCenter, rng() < 0.35 ? 2 : 1);
    stalledAttempts = 0;
  }

  fillWithNeighborGrowth(
    passable,
    rng,
    TARGET_PASSABLE_TILES['branching-spine'],
    13,
    0.1,
  );
  return passable;
}

function buildDenseMaze(seed: string) {
  const rng = createRng(`${seed}:dense-maze`);
  const passable = new Map<string, HexCoord>();
  const frontier = new Map<string, HexCoord>();

  for (const coord of addRoom(passable, ORIGIN, 1)) {
    enqueueFrontierNeighbors(passable, frontier, coord, 12);
  }

  let stalledAttempts = 0;
  while (
    passable.size < TARGET_PASSABLE_TILES['dense-maze'] &&
    stalledAttempts < 900
  ) {
    if (frontier.size === 0) {
      rebuildFrontier(passable, frontier, 12);
      if (frontier.size === 0) {
        break;
      }
    }

    const candidate = pickArrayValue(Array.from(frontier.values()), rng);
    if (!candidate) {
      stalledAttempts += 1;
      continue;
    }

    frontier.delete(hexKey(candidate));

    if (hexDistance(candidate, ORIGIN) > 12) {
      stalledAttempts += 1;
      continue;
    }

    const existingNeighborCount = getPassableNeighbors(
      passable,
      candidate,
    ).length;
    const shouldOpenLoop = existingNeighborCount === 2 && rng() < 0.18;

    if (
      existingNeighborCount === 0 ||
      existingNeighborCount > 2 ||
      (existingNeighborCount === 2 && !shouldOpenLoop)
    ) {
      stalledAttempts += 1;
      continue;
    }

    addCoord(passable, candidate);
    enqueueFrontierNeighbors(passable, frontier, candidate, 12);

    if (rng() < 0.08) {
      for (const roomCoord of addRoom(passable, candidate, 1)) {
        enqueueFrontierNeighbors(passable, frontier, roomCoord, 12);
      }
    }

    stalledAttempts = 0;
  }

  fillWithNeighborGrowth(
    passable,
    rng,
    TARGET_PASSABLE_TILES['dense-maze'],
    12,
    0.06,
  );
  return passable;
}

function fillWithNeighborGrowth(
  passable: PassableMap,
  rng: () => number,
  targetSize: number,
  maxRadius: number,
  chamberChance: number,
) {
  let stalledAttempts = 0;

  while (passable.size < targetSize && stalledAttempts < targetSize * 40) {
    const outerCoords = Array.from(passable.values()).filter(
      (coord) => hexDistance(coord, ORIGIN) >= Math.floor(maxRadius / 2),
    );
    const anchorPool =
      outerCoords.length > 0 ? outerCoords : Array.from(passable.values());
    const anchor = pickArrayValue(anchorPool, rng);

    if (!anchor) {
      stalledAttempts += 1;
      continue;
    }

    const direction =
      HEX_DIRECTIONS[Math.floor(rng() * HEX_DIRECTIONS.length)]!;
    const candidate = translateCoord(anchor, direction, 1);

    if (
      passable.has(hexKey(candidate)) ||
      hexDistance(candidate, ORIGIN) > maxRadius
    ) {
      stalledAttempts += 1;
      continue;
    }

    addCoord(passable, candidate);

    if (rng() < chamberChance) {
      addRoom(passable, candidate, 1);
    }

    stalledAttempts = 0;
  }

  if (passable.size < targetSize) {
    throw new Error('Dungeon layout below minimum passable size.');
  }
}

function rebuildFrontier(
  passable: PassableMap,
  frontier: PassableMap,
  maxRadius: number,
) {
  frontier.clear();
  for (const coord of passable.values()) {
    enqueueFrontierNeighbors(passable, frontier, coord, maxRadius);
  }
}

function enqueueFrontierNeighbors(
  passable: PassableMap,
  frontier: PassableMap,
  coord: HexCoord,
  maxRadius: number,
) {
  for (const neighbor of HEX_DIRECTIONS.map((direction) =>
    translateCoord(coord, direction, 1),
  )) {
    if (
      passable.has(hexKey(neighbor)) ||
      hexDistance(neighbor, ORIGIN) > maxRadius
    ) {
      continue;
    }

    frontier.set(hexKey(neighbor), neighbor);
  }
}

function addRoom(passable: PassableMap, center: HexCoord, radius: number) {
  const added: HexCoord[] = [];

  for (const coord of hexesInRange(center, radius)) {
    if (addCoord(passable, coord)) {
      added.push(coord);
    }
  }

  return added;
}

function addCoord(passable: PassableMap, coord: HexCoord) {
  const key = hexKey(coord);
  if (passable.has(key)) {
    return false;
  }

  passable.set(key, coord);
  return true;
}

function carveStraightPath(
  passable: PassableMap,
  start: HexCoord,
  direction: HexCoord,
  steps: number,
) {
  let cursor = start;
  for (let index = 0; index < steps; index += 1) {
    cursor = translateCoord(cursor, direction, 1);
    addCoord(passable, cursor);
  }
  return cursor;
}

function getPassableNeighbors(passable: PassableMap, coord: HexCoord) {
  return HEX_DIRECTIONS.map((direction) =>
    translateCoord(coord, direction, 1),
  ).filter((neighbor) => passable.has(hexKey(neighbor)));
}

function translateCoord(coord: HexCoord, direction: HexCoord, steps: number) {
  return {
    q: coord.q + direction.q * steps,
    r: coord.r + direction.r * steps,
  };
}

function rotateDirectionIndex(index: number, delta: number) {
  const length = HEX_DIRECTIONS.length;
  return (((index + delta) % length) + length) % length;
}

function compareCoords(a: HexCoord, b: HexCoord) {
  return a.q - b.q || a.r - b.r;
}

function pickArrayValue<T>(values: readonly T[], rng: () => number) {
  if (values.length === 0) {
    return null;
  }

  return values[Math.floor(rng() * values.length)] ?? null;
}
