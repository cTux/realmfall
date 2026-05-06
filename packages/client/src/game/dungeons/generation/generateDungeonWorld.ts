import { enemyKey, makeEnemy } from '../../combat';
import {
  DUNGEON_THEME_IDS,
  type DungeonThemeId,
  type DungeonWorldState,
} from '../types';
import { hexDistance, hexKey, hexesInRange, type HexCoord } from '../../hex';
import { createRng } from '../../random';
import type { Enemy, Tile } from '../../types';
import { createDungeonWorldState } from '../worldState';
import {
  DUNGEON_THEME_CATALOG,
  type DungeonThemeDefinition,
} from './dungeonThemes';
import {
  buildDungeonPassableCoords,
  pickDungeonTemplateId,
} from './dungeonTemplates';

const ENTRANCE_COORD: HexCoord = { q: 0, r: 0 };
const MIN_PASSABLE_TILES = 200;

export function generateDungeonWorld({
  dungeonId,
  gameRadius,
  seed,
  surfaceCoord,
}: {
  dungeonId: string;
  gameRadius: number;
  seed: string;
  surfaceCoord: HexCoord;
}): DungeonWorldState {
  const worldSeed = `${seed}:${dungeonId}`;
  const templateId = pickDungeonTemplateId(worldSeed);
  const themeId = pickDungeonThemeId(worldSeed);
  const theme = DUNGEON_THEME_CATALOG[themeId];
  const passableCoords = buildDungeonPassableCoords(templateId, worldSeed);

  if (passableCoords.length < MIN_PASSABLE_TILES) {
    throw new Error('Dungeon layout below minimum passable size.');
  }

  const layoutPlan = buildDungeonRoutePlan(passableCoords, worldSeed);
  const tiles = buildPaddedDungeonTiles(
    passableCoords,
    theme,
    worldSeed,
    Math.max(1, gameRadius),
  );
  const enemies: Record<string, Enemy> = {};

  const entranceKey = hexKey(ENTRANCE_COORD);
  tiles[entranceKey] = {
    ...tiles[entranceKey],
    coord: ENTRANCE_COORD,
    structure: 'dungeon',
  };

  const chestKey = hexKey(layoutPlan.finalChestCoord);
  tiles[chestKey] = {
    ...tiles[chestKey],
    coord: layoutPlan.finalChestCoord,
    structure: 'dungeon-chest',
  };

  layoutPlan.enemyCoords.forEach((coord, index) => {
    const tileKey = hexKey(coord);
    const enemy = makeEnemy(
      worldSeed,
      coord,
      tiles[tileKey]!.terrain,
      index,
      'dungeon',
      false,
      { levelCoord: surfaceCoord },
    );
    enemy.dungeonSpawnCoord = { ...coord };

    tiles[tileKey]!.enemyIds.push(enemy.id);
    enemies[enemy.id] = enemy;
  });

  const finalEliteEnemyId = enemyKey(layoutPlan.finalEliteCoord, 0);
  const eliteKey = hexKey(layoutPlan.finalEliteCoord);
  const finalElite = makeEnemy(
    worldSeed,
    layoutPlan.finalEliteCoord,
    tiles[eliteKey]!.terrain,
    0,
    'dungeon',
    false,
    {
      enemyId: finalEliteEnemyId,
      levelCoord: surfaceCoord,
      rarity: 'legendary',
    },
  );
  finalElite.elite = true;
  finalElite.dungeonSpawnCoord = { ...layoutPlan.finalEliteCoord };
  tiles[eliteKey]!.enemyIds.push(finalEliteEnemyId);
  enemies[finalEliteEnemyId] = finalElite;

  return createDungeonWorldState({
    id: dungeonId,
    tiles,
    enemies,
    dungeon: {
      cleared: false,
      entranceCoord: ENTRANCE_COORD,
      finalChestCoord: layoutPlan.finalChestCoord,
      finalEliteEnemyId,
      paddingRadius: Math.max(1, gameRadius),
      surfaceEntranceCoord: surfaceCoord,
      templateId,
      themeId,
    },
  });
}

function pickDungeonThemeId(seed: string): DungeonThemeId {
  return (
    DUNGEON_THEME_IDS[
      Math.floor(createRng(`${seed}:theme`)() * DUNGEON_THEME_IDS.length)
    ] ?? DUNGEON_THEME_IDS[0]
  );
}

function buildDungeonRoutePlan(passableCoords: HexCoord[], seed: string) {
  const passableByKey = new Map(
    passableCoords.map((coord) => [hexKey(coord), coord] as const),
  );
  const { distances, parents } = measureGraphDistances(passableByKey);
  const finalChestCoord = pickFinalChestCoord(
    passableCoords,
    passableByKey,
    distances,
  );
  const finalEliteCoord = pickFinalEliteCoord(
    finalChestCoord,
    passableByKey,
    distances,
    parents,
  );
  const enemyCoords = pickEnemyCoords(
    passableCoords,
    passableByKey,
    distances,
    finalChestCoord,
    finalEliteCoord,
    `${seed}:enemies`,
  );

  return {
    enemyCoords,
    finalChestCoord,
    finalEliteCoord,
  };
}

function buildPaddedDungeonTiles(
  passableCoords: HexCoord[],
  theme: DungeonThemeDefinition,
  seed: string,
  paddingRadius: number,
) {
  const tiles: Record<string, Tile> = {};
  const layoutRadius =
    Math.max(
      0,
      ...passableCoords.map((coord) => hexDistance(coord, ENTRANCE_COORD)),
    ) + paddingRadius;

  for (const coord of hexesInRange(ENTRANCE_COORD, layoutRadius)) {
    tiles[hexKey(coord)] = makeTile(coord, theme.wall);
  }

  for (const coord of passableCoords) {
    tiles[hexKey(coord)] = makeTile(
      coord,
      resolveFloorTerrain(theme, coord, seed),
    );
  }

  return tiles;
}

function resolveFloorTerrain(
  theme: DungeonThemeDefinition,
  coord: HexCoord,
  seed: string,
): Tile['terrain'] {
  if (coord.q === ENTRANCE_COORD.q && coord.r === ENTRANCE_COORD.r) {
    return theme.floors[0];
  }

  const roll = createRng(`${seed}:terrain:${coord.q}:${coord.r}`)();
  if (roll > 0.82) {
    return theme.floors[2];
  }
  if (roll > 0.57) {
    return theme.floors[1];
  }
  return theme.floors[0];
}

function measureGraphDistances(passableByKey: Map<string, HexCoord>) {
  const distances = new Map<string, number>([[hexKey(ENTRANCE_COORD), 0]]);
  const parents = new Map<string, string | null>([
    [hexKey(ENTRANCE_COORD), null],
  ]);
  const queue: HexCoord[] = [ENTRANCE_COORD];

  for (let index = 0; index < queue.length; index += 1) {
    const coord = queue[index]!;
    const coordKey = hexKey(coord);
    const distance = distances.get(coordKey) ?? 0;

    for (const neighbor of getPassableNeighbors(passableByKey, coord)) {
      const neighborKey = hexKey(neighbor);
      if (distances.has(neighborKey)) {
        continue;
      }

      distances.set(neighborKey, distance + 1);
      parents.set(neighborKey, coordKey);
      queue.push(neighbor);
    }
  }

  return { distances, parents };
}

function pickFinalChestCoord(
  passableCoords: HexCoord[],
  passableByKey: Map<string, HexCoord>,
  distances: Map<string, number>,
) {
  return (
    passableCoords
      .filter((coord) => hexKey(coord) !== hexKey(ENTRANCE_COORD))
      .sort((left, right) => {
        const distanceDifference =
          (distances.get(hexKey(right)) ?? -1) -
          (distances.get(hexKey(left)) ?? -1);
        if (distanceDifference !== 0) {
          return distanceDifference;
        }

        const degreeDifference =
          getPassableNeighbors(passableByKey, left).length -
          getPassableNeighbors(passableByKey, right).length;
        if (degreeDifference !== 0) {
          return degreeDifference;
        }

        return compareCoords(left, right);
      })[0] ?? ENTRANCE_COORD
  );
}

function pickFinalEliteCoord(
  finalChestCoord: HexCoord,
  passableByKey: Map<string, HexCoord>,
  distances: Map<string, number>,
  parents: Map<string, string | null>,
) {
  const chestKey = hexKey(finalChestCoord);
  const candidateKeys = new Map<string, number>();
  const queue: Array<{ coord: HexCoord; steps: number }> = [
    { coord: finalChestCoord, steps: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.steps === 2) {
      continue;
    }

    for (const neighbor of getPassableNeighbors(passableByKey, current.coord)) {
      const neighborKey = hexKey(neighbor);
      if (candidateKeys.has(neighborKey)) {
        continue;
      }

      candidateKeys.set(neighborKey, current.steps + 1);
      queue.push({ coord: neighbor, steps: current.steps + 1 });
    }
  }

  const nearbyCandidate = Array.from(candidateKeys.entries())
    .filter(
      ([key, steps]) =>
        key !== chestKey && key !== hexKey(ENTRANCE_COORD) && steps > 0,
    )
    .map(([key, steps]) => ({
      coord: passableByKey.get(key)!,
      distance: distances.get(key) ?? 0,
      steps,
    }))
    .sort((left, right) => {
      const stepDifference = left.steps - right.steps;
      if (stepDifference !== 0) {
        return stepDifference;
      }

      const distanceDifference = right.distance - left.distance;
      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return compareCoords(left.coord, right.coord);
    })[0]?.coord;

  if (nearbyCandidate) {
    return nearbyCandidate;
  }

  let parentKey = parents.get(chestKey) ?? null;
  while (parentKey) {
    if (parentKey !== hexKey(ENTRANCE_COORD)) {
      return passableByKey.get(parentKey) ?? ENTRANCE_COORD;
    }
    parentKey = parents.get(parentKey) ?? null;
  }

  return ENTRANCE_COORD;
}

function pickEnemyCoords(
  passableCoords: HexCoord[],
  passableByKey: Map<string, HexCoord>,
  distances: Map<string, number>,
  finalChestCoord: HexCoord,
  finalEliteCoord: HexCoord,
  seed: string,
) {
  const blockedKeys = new Set([
    hexKey(ENTRANCE_COORD),
    hexKey(finalChestCoord),
    hexKey(finalEliteCoord),
  ]);
  const shuffledCandidates = shuffleCoords(
    passableCoords.filter((coord) => {
      const coordKey = hexKey(coord);
      return !blockedKeys.has(coordKey) && (distances.get(coordKey) ?? 0) >= 2;
    }),
    seed,
  );
  const targetCount = Math.max(
    14,
    Math.min(22, Math.floor(passableCoords.length / 14)),
  );
  const selected: HexCoord[] = [];

  for (const minimumSpacing of [3, 2, 1]) {
    for (const coord of shuffledCandidates) {
      if (selected.length >= targetCount) {
        break;
      }

      if (
        selected.some(
          (existing) => hexDistance(existing, coord) < minimumSpacing,
        ) ||
        hexDistance(coord, finalChestCoord) < 2
      ) {
        continue;
      }

      if (!passableByKey.has(hexKey(coord))) {
        continue;
      }

      selected.push(coord);
    }

    if (selected.length >= targetCount) {
      break;
    }
  }

  return selected;
}

function getPassableNeighbors(
  passableByKey: Map<string, HexCoord>,
  coord: HexCoord,
) {
  return [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q + 1, r: coord.r - 1 },
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q, r: coord.r + 1 },
  ].filter((neighbor) => passableByKey.has(hexKey(neighbor)));
}

function shuffleCoords(coords: HexCoord[], seed: string) {
  const shuffled = [...coords];
  const rng = createRng(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }

  return shuffled;
}

function makeTile(coord: HexCoord, terrain: Tile['terrain']): Tile {
  return {
    coord,
    terrain,
    items: [],
    enemyIds: [],
  };
}

function compareCoords(left: HexCoord, right: HexCoord) {
  return left.q - right.q || left.r - right.r;
}
