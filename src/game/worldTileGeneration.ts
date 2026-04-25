import {
  TOWN_SEARCH_LIMIT,
  WORLD_ENEMY_SPAWN_CHANCE,
} from './config';
import {
  getGatheringStructureConfig,
  isGatheringStructureType,
  pickStructureType,
} from './content/structures';
import { enemyKey } from './combat';
import { hexDistance, hexNeighbors, type HexCoord } from './hex';
import {
  getFactionClaim,
  getFactionStructure,
  makeFactionNpcEnemyId,
} from './territories';
import { isPassable, noise, scaledIndex } from './shared';
import type { StructureType, Terrain, Tile, TileClaim } from './types';
import { isWorldBossCenter } from './worldBoss';
import { pickTerrain } from './worldTerrain';

export function findSpawnedWorldBossCenter(seed: string, coord: HexCoord) {
  const candidates = [coord, ...hexNeighbors(coord)];

  for (const candidate of candidates) {
    const terrain = pickTerrain(seed, candidate);
    if (!isWorldBossCenter(seed, candidate, terrain)) continue;

    const footprint = [candidate, ...hexNeighbors(candidate)].map((tileCoord) =>
      buildRegularTile(seed, tileCoord, pickTerrain(seed, tileCoord)),
    );
    if (footprint.every(isEmptyWorldBossSpawnTile)) {
      return candidate;
    }
  }

  return null;
}

export function findNearestStructureCoord(
  seed: string,
  from: HexCoord,
  structure: StructureType,
  buildTile: (seed: string, coord: HexCoord) => Tile,
) {
  for (let radius = 0; radius <= TOWN_SEARCH_LIMIT; radius += 1) {
    for (let q = from.q - radius; q <= from.q + radius; q += 1) {
      for (let r = from.r - radius; r <= from.r + radius; r += 1) {
        const coord = { q, r };
        if (hexDistance(from, coord) !== radius) continue;
        if (buildTile(seed, coord).structure === structure) return coord;
      }
    }
  }
  return undefined;
}

export function buildRegularTile(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
): Tile {
  const factionClaim = getFactionClaim(seed, coord);
  const territoryNpcEnemyId = makeFactionNpcEnemyId(coord);
  const structureCandidate = isPassable(terrain)
    ? (getFactionStructure(seed, coord) ?? pickStructure(seed, coord, terrain))
    : undefined;
  const structure =
    factionClaim?.npc && structureCandidate !== undefined
      ? undefined
      : structureCandidate;
  const structureStats = structure ? makeStructureState(structure) : undefined;
  const enemyIds = buildEnemyIds(
    seed,
    coord,
    terrain,
    structure,
    factionClaim ?? undefined,
    territoryNpcEnemyId,
  );
  const items: Tile['items'] = [];

  return {
    coord,
    terrain,
    structure,
    structureHp: structureStats?.hp,
    structureMaxHp: structureStats?.maxHp,
    items,
    enemyIds,
    claim: factionClaim ?? undefined,
  };
}

function buildEnemyIds(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  structure?: StructureType,
  claim?: TileClaim,
  npcEnemyId = makeFactionNpcEnemyId(coord),
) {
  if (!isPassable(terrain)) return [];
  if (claim) return claim.npc ? [claim.npc.enemyId ?? npcEnemyId] : [];
  if (hexDistance(coord, { q: 0, r: 0 }) <= 1) return [];
  if (structure && structure !== 'dungeon') return [];
  if (structure === 'dungeon') {
    const count = 1 + scaledIndex(`${seed}:dungeon-count`, coord, 3);
    return Array.from({ length: count }, (_, index) => enemyKey(coord, index));
  }
  return shouldSpawnEnemy(seed, coord, terrain) ? [enemyKey(coord, 0)] : [];
}

function isEmptyWorldBossSpawnTile(tile: Tile) {
  return (
    isPassable(tile.terrain) &&
    !tile.structure &&
    tile.enemyIds.length === 0 &&
    tile.items.length === 0 &&
    !tile.claim
  );
}

function pickStructure(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
): StructureType | undefined {
  const roll = noise(`${seed}:structure`, coord);
  const resourceRoll = noise(`${seed}:resource-structure`, coord);
  return pickStructureType(roll, resourceRoll, terrain);
}

function shouldSpawnEnemy(seed: string, coord: HexCoord, terrain: Terrain) {
  if (!isPassable(terrain)) return false;
  return noise(`${seed}:enemy:spawn`, coord) < WORLD_ENEMY_SPAWN_CHANCE;
}

function makeStructureState(structure: StructureType) {
  if (!isGatheringStructureType(structure)) return undefined;
  const maxHp = getGatheringStructureConfig(structure).gathering.maxHp;
  return { hp: maxHp, maxHp };
}
