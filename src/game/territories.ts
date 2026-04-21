import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import {
  TERRITORY_FACTION_REGION_SPAWN_CHANCE,
  TERRITORY_STRUCTURE_CHANCES,
  pickByDescendingChanceMap,
  pickTerrainFromChanceMap,
} from './config';
import { noise } from './shared';
import type { StructureType, Terrain, TerritoryNpc, TileClaim } from './types';

const FACTION_NPC_ENEMY_ID_PREFIX = 'faction-npc';
const FACTION_REGION_SIZE = 12;
const FACTION_REGION_SCAN_RADIUS = 1;
const MIN_FACTION_DISTANCE_FROM_ORIGIN = 6;
const PLAYER_TERRITORY_ID = 'player-territory';
const PLAYER_TERRITORY_NAME = 'Bound Territory';
export const PLAYER_BANNER_COLOR = '#60a5fa';
export const PLAYER_BORDER_COLOR = '#ffffff';

interface FactionTerritory {
  id: string;
  name: string;
  center: HexCoord;
  color: string;
  tiles: HexCoord[];
  tileKeys: Set<string>;
  structuresByTileKey: Record<string, StructureType | undefined>;
  npcsByTileKey: Record<string, TerritoryNpc>;
}

const territoryCacheBySeed = new Map<
  string,
  Map<string, FactionTerritory | null>
>();

export function makePlayerClaim(): TileClaim {
  return {
    ownerId: PLAYER_TERRITORY_ID,
    ownerType: 'player',
    ownerName: PLAYER_TERRITORY_NAME,
    borderColor: PLAYER_BORDER_COLOR,
  };
}

export function isPlayerClaim(claim?: TileClaim | null) {
  return claim?.ownerType === 'player' && claim.ownerId === PLAYER_TERRITORY_ID;
}

export function getFactionClaim(
  seed: string,
  coord: HexCoord,
): TileClaim | null {
  const territory = getFactionTerritory(seed, coord);
  if (!territory) return null;

  return {
    ownerId: territory.id,
    ownerType: 'faction',
    ownerName: territory.name,
    borderColor: territory.color,
    npc: territory.npcsByTileKey[hexKey(coord)],
  };
}

export function makeFactionNpcEnemyId(coord: HexCoord) {
  return `${FACTION_NPC_ENEMY_ID_PREFIX}:${coord.q}:${coord.r}`;
}

export function isFactionNpcEnemyId(enemyId: string) {
  return enemyId.startsWith(`${FACTION_NPC_ENEMY_ID_PREFIX}:`);
}

export function getFactionStructure(
  seed: string,
  coord: HexCoord,
): StructureType | undefined {
  const territory = getFactionTerritory(seed, coord);
  if (!territory) return undefined;
  return territory.structuresByTileKey[hexKey(coord)];
}

function getFactionTerritory(seed: string, coord: HexCoord) {
  const cacheKey = hexKey(coord);
  const cachedByCoord = territoryCacheBySeed.get(seed);
  const cached = cachedByCoord?.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = findFactionTerritory(seed, coord);
  const nextCache = cachedByCoord ?? new Map<string, FactionTerritory | null>();
  nextCache.set(cacheKey, result);
  territoryCacheBySeed.set(seed, nextCache);
  return result;
}

function findFactionTerritory(seed: string, coord: HexCoord) {
  const regionQ = Math.floor(coord.q / FACTION_REGION_SIZE);
  const regionR = Math.floor(coord.r / FACTION_REGION_SIZE);

  for (
    let dq = -FACTION_REGION_SCAN_RADIUS;
    dq <= FACTION_REGION_SCAN_RADIUS;
    dq += 1
  ) {
    for (
      let dr = -FACTION_REGION_SCAN_RADIUS;
      dr <= FACTION_REGION_SCAN_RADIUS;
      dr += 1
    ) {
      const territory = generateFactionTerritory(seed, {
        q: regionQ + dq,
        r: regionR + dr,
      });
      if (territory?.tileKeys.has(hexKey(coord))) {
        return territory;
      }
    }
  }

  return null;
}

function generateFactionTerritory(seed: string, region: HexCoord) {
  const regionSeed = `${seed}:faction-region:${region.q},${region.r}`;
  if (
    noise(`${regionSeed}:spawn`, region) >=
      TERRITORY_FACTION_REGION_SPAWN_CHANCE ||
    hexDistance(region, { q: 0, r: 0 }) <= 0
  ) {
    return null;
  }

  const center = {
    q:
      region.q * FACTION_REGION_SIZE +
      Math.floor(noise(`${regionSeed}:center-q`, region) * 8) -
      4,
    r:
      region.r * FACTION_REGION_SIZE +
      Math.floor(noise(`${regionSeed}:center-r`, region) * 8) -
      4,
  };
  if (hexDistance(center, { q: 0, r: 0 }) < MIN_FACTION_DISTANCE_FROM_ORIGIN) {
    return null;
  }
  if (!isPassableFactionTerrain(seed, center)) {
    return null;
  }

  const targetSize = 7 + Math.floor(noise(`${regionSeed}:size`, region) * 19);
  const tiles = buildTerritoryTiles(seed, center, targetSize, regionSeed);
  if (tiles.length < 7) {
    return null;
  }

  const name = makeFactionName(regionSeed, region);
  const color = pickFactionColor(regionSeed, region);
  const structuresByTileKey = assignFactionStructures(
    regionSeed,
    center,
    tiles,
  );
  const npcsByTileKey = assignFactionNpcs(
    regionSeed,
    tiles,
    structuresByTileKey,
  );
  return {
    id: `faction-${region.q},${region.r}`,
    name,
    center,
    color,
    tiles,
    tileKeys: new Set(tiles.map((tile) => hexKey(tile))),
    structuresByTileKey,
    npcsByTileKey,
  } satisfies FactionTerritory;
}

function buildTerritoryTiles(
  seed: string,
  center: HexCoord,
  targetSize: number,
  regionSeed: string,
) {
  const visited = new Set([hexKey(center)]);
  const claimed = [center];
  const frontier = [center];

  while (frontier.length > 0 && claimed.length < targetSize) {
    const current = frontier.shift();
    if (!current) break;

    const neighbors = hexNeighbors(current)
      .filter((neighbor) => !visited.has(hexKey(neighbor)))
      .sort((left, right) => {
        const leftScore = territoryExpansionScore(regionSeed, left, center);
        const rightScore = territoryExpansionScore(regionSeed, right, center);
        return leftScore - rightScore;
      });

    neighbors.forEach((neighbor) => {
      const key = hexKey(neighbor);
      if (visited.has(key) || claimed.length >= targetSize) {
        return;
      }
      visited.add(key);

      if (
        hexDistance(center, neighbor) > 3 ||
        !isPassableFactionTerrain(seed, neighbor)
      ) {
        return;
      }

      claimed.push(neighbor);
      frontier.push(neighbor);
    });
  }

  return claimed;
}

function territoryExpansionScore(
  regionSeed: string,
  coord: HexCoord,
  center: HexCoord,
) {
  return (
    hexDistance(coord, center) +
    noise(`${regionSeed}:expand`, coord) * 0.8 +
    noise(`${regionSeed}:expand-variant`, coord) * 0.35
  );
}

function assignFactionStructures(
  regionSeed: string,
  center: HexCoord,
  tiles: HexCoord[],
) {
  const centerKey = hexKey(center);
  const entries: Array<[string, StructureType | undefined]> = tiles.map(
    (tile) => {
      if (hexKey(tile) === centerKey) {
        return [hexKey(tile), 'town'];
      }

      const roll = noise(`${regionSeed}:building`, tile);
      const structureKey = pickByDescendingChanceMap(
        roll,
        TERRITORY_STRUCTURE_CHANCES,
      );
      const structure = structureKey === 'none' ? undefined : structureKey;
      return [hexKey(tile), structure];
    },
  );

  return Object.fromEntries(entries);
}

function assignFactionNpcs(
  regionSeed: string,
  tiles: HexCoord[],
  structuresByTileKey: Record<string, StructureType | undefined>,
) {
  if (tiles.length === 0) {
    return {};
  }

  const emptyTileKeys = tiles
    .map((tile) => [hexKey(tile), tile] as const)
    .filter(([, tile]) => !structuresByTileKey[hexKey(tile)])
    .map(([key]) => key);

  if (emptyTileKeys.length === 0) {
    return {};
  }

  const npcTileIndex = Math.floor(
    Math.max(0, Math.min(0.999999, noise(`${regionSeed}:npc-tile`, tiles[0]))) *
      emptyTileKeys.length,
  );
  const npcTileKey = emptyTileKeys[npcTileIndex];
  const npcTile = tiles.find((tile) => hexKey(tile) === npcTileKey);
  if (!npcTile) {
    return {};
  }

  const npcSeed = `${regionSeed}:${npcTileKey}:npc`;
  return {
    [npcTileKey]: {
      name: makeLoreName(npcSeed, npcTile),
      enemyId: makeFactionNpcEnemyId(npcTile),
    },
  } as const;
}

function makeFactionName(regionSeed: string, region: HexCoord) {
  const prefixes = ['Arken', 'Vale', 'Iron', 'Cinder', 'Storm', 'Shard'];
  const suffixes = ['reach', 'hold', 'rest', 'spire', 'watch', 'haven'];
  const prefix =
    prefixes[
      Math.floor(noise(`${regionSeed}:name-prefix`, region) * prefixes.length)
    ] ?? prefixes[0];
  const suffix =
    suffixes[
      Math.floor(noise(`${regionSeed}:name-suffix`, region) * suffixes.length)
    ] ?? suffixes[0];
  return `${prefix}${suffix}`;
}

function makeLoreName(seed: string, coord: HexCoord) {
  const first = ['Ara', 'Vale', 'Tor', 'Keth', 'Lysa', 'Bran', 'Sera', 'Orin'];
  const second = ['ken', 'born', 'ric', 'drel', 'wyn', 'mar', 'thel', 'voss'];
  const left =
    first[Math.floor(noise(`${seed}:left`, coord) * first.length)] ?? first[0];
  const right =
    second[Math.floor(noise(`${seed}:right`, coord) * second.length)] ??
    second[0];
  return `${left}${right}`;
}

function pickFactionColor(seed: string, coord: HexCoord) {
  const palette = ['#f59e0b', '#22c55e', '#38bdf8', '#e879f9', '#f97316'];
  return (
    palette[Math.floor(noise(`${seed}:color`, coord) * palette.length)] ??
    palette[0]
  );
}

function isPassableFactionTerrain(seed: string, coord: HexCoord) {
  const terrain = pickFactionTerrain(seed, coord);
  return terrain !== 'rift' && terrain !== 'mountain';
}

function pickFactionTerrain(seed: string, coord: HexCoord): Terrain {
  return pickTerrainFromChanceMap(noise(seed, coord));
}
