import {
  buildGeneratedItemFromConfig,
  getGeneratedAccessoryKeys,
  getGeneratedArmorKeys,
  getGeneratedOffhandKeys,
  getGeneratedWeaponKeys,
} from './content/items';
import {
  TOWN_SEARCH_LIMIT,
  WORLD_ENEMY_SPAWN_CHANCE,
  WORLD_LOOT_CHANCES,
  pickWorldGeneratedItemKind,
  resolveGuardedLootChance,
} from './config';
import {
  getGatheringStructureConfig,
  getStructureConfig,
  isGatheringStructureType,
  pickStructureType,
} from './content/structures';
import { enemyIndexFromId, enemyKey, makeEnemy } from './combat';
import { makeConsumable } from './inventory';
import {
  isFactionNpcEnemyId,
  makeFactionNpcEnemyId,
  getFactionClaim,
  getFactionStructure,
} from './territories';
import {
  isPassable,
  itemId,
  noise,
  pickEquipmentRarity,
  scaledIndex,
  terrainTier,
} from './shared';
import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { pickWorldTerrain } from './worldTerrain';
import {
  isWorldBossCenter,
  isWorldBossEnemyId,
  worldBossEnemyId,
} from './worldBoss';
import type {
  GameState,
  GatheringStructureType,
  Item,
  ItemRarity,
  TileClaim,
  StructureType,
  Terrain,
  Tile,
} from './types';

export function cacheSafeStart(state: GameState) {
  const center = { q: 0, r: 0 };
  state.tiles[hexKey(center)] = {
    coord: center,
    terrain: 'plains',
    items: [],
    structure: undefined,
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
    claim: undefined,
  };
  hexNeighbors(center).forEach((coord) => {
    state.tiles[hexKey(coord)] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
      claim: undefined,
    };
  });
}

export function ensureTileState(state: GameState, coord: HexCoord) {
  const key = hexKey(coord);
  if (!state.tiles[key]) {
    state.tiles[key] = buildTile(state.seed, coord);
  }

  const tile = state.tiles[key];
  tile.enemyIds.forEach((enemyId) => {
    if (!state.enemies[enemyId]) {
      const enemyName =
        tile.claim?.npc?.enemyId === enemyId ? tile.claim?.npc.name : undefined;
      state.enemies[enemyId] = makeEnemy(
        state.seed,
        coord,
        tile.terrain,
        enemyIndexFromId(enemyId),
        tile.structure,
        state.bloodMoonActive,
        {
          enemyId,
          name: enemyName,
          aggressive: !isFactionNpcEnemyId(enemyId),
          worldBoss: isWorldBossEnemyId(enemyId),
        },
      );
    }
  });
}

export function buildTile(seed: string, coord: HexCoord): Tile {
  if (coord.q === 0 && coord.r === 0) {
    return {
      coord,
      terrain: 'plains',
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
    };
  }

  const terrain = pickTerrain(seed, coord);
  const worldBossCenter = getSpawnedWorldBossCenter(seed, coord);
  if (worldBossCenter) {
    const isBossCenter =
      worldBossCenter.q === coord.q && worldBossCenter.r === coord.r;
    return {
      coord,
      terrain,
      structure: undefined,
      items: [],
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: isBossCenter ? [worldBossEnemyId(coord)] : [],
    };
  }
  return buildRegularTile(seed, coord, terrain);
}

function getSpawnedWorldBossCenter(seed: string, coord: HexCoord) {
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

export function findNearestStructure(
  seed: string,
  from: HexCoord,
  structure: StructureType,
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

export function isGatheringStructure(
  structure?: StructureType,
): structure is GatheringStructureType {
  return isGatheringStructureType(structure);
}

export function structureActionLabel(structure?: StructureType) {
  if (!structure) return null;
  return isGatheringStructure(structure)
    ? getGatheringStructureConfig(structure).gathering.actionLabel
    : null;
}

export function describeStructure(structure?: StructureType) {
  if (!structure) return 'None';
  return getStructureConfig(structure).title;
}

export function normalizeStructureState(tile: Tile): Tile {
  if (tile.structure === 'dungeon') {
    if (tile.enemyIds.length === 0 && tile.items.length === 0) {
      return {
        ...tile,
        structure: undefined,
        structureHp: undefined,
        structureMaxHp: undefined,
      };
    }
    return tile;
  }

  if (isGatheringStructure(tile.structure) && (tile.structureHp ?? 0) <= 0) {
    return {
      ...tile,
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
    };
  }

  return tile;
}

export function structureDefinition(structure: GatheringStructureType) {
  return getGatheringStructureConfig(structure).gathering;
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

function buildRegularTile(
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
  const items = maybeLoot(
    seed,
    coord,
    terrain,
    enemyIds.length > 0,
    structure,
    Boolean(factionClaim),
  );

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

function pickTerrain(seed: string, coord: HexCoord): Terrain {
  return pickWorldTerrain(seed, coord);
}

function maybeLoot(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  guarded: boolean,
  structure?: StructureType,
  claimed = false,
) {
  if (claimed) return [];
  const roll = noise(`${seed}:loot`, coord);
  const tier = terrainTier(coord, terrain) + (structure === 'dungeon' ? 2 : 0);
  const lootChance = isGatheringStructure(structure)
    ? 0
    : structure === 'dungeon'
      ? WORLD_LOOT_CHANCES.dungeon
      : guarded
        ? resolveGuardedLootChance(tier)
        : WORLD_LOOT_CHANCES.unguarded;
  if (roll >= lootChance) return [];
  const outcomeRoll = resolveLootOutcomeRoll(roll);

  const items: Item[] = [];
  items.push(makeGeneratedItem(seed, coord, tier, outcomeRoll, structure));

  if (structure === 'dungeon') {
    items.push(
      makeGeneratedItem(
        `${seed}:dungeon-chest`,
        coord,
        tier + 1,
        outcomeRoll + 0.18,
        structure,
      ),
    );
  } else if (outcomeRoll >= 1 - WORLD_LOOT_CHANCES.bonusCache) {
    items.push(makeConsumable(`${hexKey(coord)}-cache`, 'apple', tier, 6, 20));
  }

  return items;
}

function makeGeneratedItem(
  seed: string,
  coord: HexCoord,
  tier: number,
  roll: number,
  structure?: StructureType,
) {
  const minimumRarity = structure === 'dungeon' ? 'rare' : undefined;

  switch (pickWorldGeneratedItemKind(roll)) {
    case 'artifact':
      return makeArtifact(seed, coord, tier, minimumRarity);
    case 'weapon':
      return makeWeapon(seed, coord, tier, minimumRarity);
    case 'offhand':
      return makeOffhand(seed, coord, tier, minimumRarity);
    case 'armor':
      return makeArmor(seed, coord, tier, minimumRarity);
    default:
      return makeConsumable(
        itemId('consumable', coord, seed),
        'trail-ration',
        tier,
        8,
        12,
      );
  }
}

export function resolveLootOutcomeRoll(roll: number) {
  const normalized = Math.max(0, Math.min(0.999999, roll));
  return 1 - normalized;
}

export function makeWeapon(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const keys = getGeneratedWeaponKeys();
  const key = keys[scaledIndex(`${seed}:weapon:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('weapon', coord, seed),
    tier,
    rarity,
  });
}

export function makeOffhand(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedOffhandKeys();
  const key = keys[scaledIndex(`${seed}:offhand:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('offhand', coord, seed),
    tier,
    rarity,
  });
}

export function makeArmor(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedArmorKeys();
  const key = keys[scaledIndex(`${seed}:armor:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(seed, coord, tier, minimumRarity);
  return buildGeneratedItemFromConfig(key, {
    id: itemId('armor', coord, seed),
    tier,
    rarity,
  });
}

export function makeArtifact(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
) {
  const keys = getGeneratedAccessoryKeys();
  const key = keys[scaledIndex(`${seed}:artifact:key`, coord, keys.length)];
  const rarity = pickEquipmentRarity(
    seed,
    coord,
    tier + 1,
    minimumRarity ?? 'uncommon',
  );
  return buildGeneratedItemFromConfig(key, {
    id: itemId('artifact', coord, seed),
    tier,
    rarity,
  });
}

function makeStructureState(structure: StructureType) {
  if (!isGatheringStructure(structure)) return undefined;
  const maxHp = structureDefinition(structure).maxHp;
  return { hp: maxHp, maxHp };
}
