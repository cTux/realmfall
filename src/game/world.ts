import { t } from '../i18n';
import { EquipmentSlotId } from './content/ids';
import {
  ARTIFACT_FORM_KEYS,
  ARTIFACT_PREFIX_KEYS,
  TOWN_SEARCH_LIMIT,
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
  applyRarityToItem,
  isPassable,
  itemId,
  noise,
  pickEquipmentRarity,
  scaledIndex,
  terrainTier,
} from './shared';
import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import {
  isWorldBossCenter,
  isWorldBossEnemyId,
  worldBossEnemyId,
} from './worldBoss';
import type {
  EquipmentSlot,
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
  return noise(`${seed}:enemy:spawn`, coord) > 0.8;
}

function pickTerrain(seed: string, coord: HexCoord): Terrain {
  const roll = noise(seed, coord);
  if (roll < 0.1) return 'rift';
  if (roll < 0.2) return 'mountain';
  if (roll < 0.4) return 'forest';
  if (roll < 0.53) return 'swamp';
  if (roll < 0.67) return 'desert';
  return 'plains';
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
    ? 1
    : structure === 'dungeon'
      ? 0.3
      : guarded
        ? Math.max(0.52, 0.7 - tier * 0.02)
        : 0.985;
  if (roll < lootChance) return [];

  const items: Item[] = [];
  items.push(makeGeneratedItem(seed, coord, tier, roll, structure));

  if (structure === 'dungeon') {
    items.push(
      makeGeneratedItem(
        `${seed}:dungeon-chest`,
        coord,
        tier + 1,
        roll + 0.18,
        structure,
      ),
    );
  } else if (roll > 0.82) {
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
  if (roll > 0.94 || tier >= 7 || structure === 'dungeon') {
    return makeArtifact(
      seed,
      coord,
      tier,
      structure === 'dungeon' ? 'rare' : undefined,
    );
  }
  if (roll > 0.84) return makeWeapon(seed, coord, tier);
  if (roll > 0.74) return makeOffhand(seed, coord, tier);
  if (roll > 0.62) return makeArmor(seed, coord, tier);
  return makeConsumable(
    itemId('consumable', coord, seed),
    'trail-ration',
    tier,
    8,
    12,
  );
}

export function makeWeapon(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const names = ['Blade', 'Spear', 'Axe', 'Bow', 'Glaive', 'Hammer'];
  const prefixes = ['Hunter', 'Warden', 'Drifter', 'Riven', 'Storm', 'Ember'];
  const index = scaledIndex(`${seed}:weapon`, coord, names.length);
  const prefixIndex = scaledIndex(
    `${seed}:weapon:prefix`,
    coord,
    prefixes.length,
  );
  return applyRarityToItem({
    id: itemId('weapon', coord, seed),
    slot: EquipmentSlotId.Weapon,
    name: `${prefixes[prefixIndex]} ${names[index]}`,
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(seed, coord, tier, minimumRarity),
    power: 2 + tier * 2,
    defense: 0,
    maxHp: tier >= 5 ? 1 : 0,
    healing: 0,
    hunger: 0,
    thirst: 0,
  });
}

export function makeOffhand(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const names = ['Buckler', 'Lantern Shield', 'Mirror Guard', 'Ward Board'];
  const index = scaledIndex(`${seed}:offhand`, coord, names.length);
  return applyRarityToItem({
    id: itemId('offhand', coord, seed),
    slot: EquipmentSlotId.Offhand,
    name: names[index],
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(seed, coord, tier, minimumRarity),
    power: tier > 2 ? 1 : 0,
    defense: 1 + tier * 2,
    maxHp: tier,
    healing: 0,
    hunger: 0,
    thirst: 0,
  });
}

export function makeArmor(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const slots: EquipmentSlot[] = [
    EquipmentSlotId.Head,
    EquipmentSlotId.Chest,
    EquipmentSlotId.Hands,
    EquipmentSlotId.Legs,
    EquipmentSlotId.Feet,
  ];
  const slot = slots[scaledIndex(`${seed}:armor:slot`, coord, slots.length)];
  const names: Record<EquipmentSlot, string[]> = {
    [EquipmentSlotId.Weapon]: [],
    [EquipmentSlotId.Offhand]: [],
    [EquipmentSlotId.Head]: ['Scout Hood', 'Iron Cap', 'Ranger Circlet'],
    [EquipmentSlotId.Chest]: ['Warden Coat', 'Scale Vest', 'Nomad Harness'],
    [EquipmentSlotId.Hands]: ['Grip Gloves', 'Hide Mitts', 'Bone Gauntlets'],
    [EquipmentSlotId.Legs]: ['Trail Greaves', 'Strider Leggings', 'Dust Wraps'],
    [EquipmentSlotId.Feet]: ['Dune Boots', 'Wolf Treads', 'Marsh Walkers'],
    [EquipmentSlotId.RingLeft]: [],
    [EquipmentSlotId.RingRight]: [],
    [EquipmentSlotId.Amulet]: [],
    [EquipmentSlotId.Cloak]: [],
    [EquipmentSlotId.Relic]: [],
  };
  const slotNames = names[slot];
  const name =
    slotNames[scaledIndex(`${seed}:armor:name`, coord, slotNames.length)];
  return applyRarityToItem({
    id: itemId('armor', coord, seed),
    slot,
    name,
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(seed, coord, tier, minimumRarity),
    power: tier >= 6 ? 1 : 0,
    defense: 1 + tier,
    maxHp: tier,
    healing: 0,
    hunger: 0,
    thirst: 0,
  });
}

export function makeArtifact(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const slots: EquipmentSlot[] = [
    EquipmentSlotId.RingLeft,
    EquipmentSlotId.RingRight,
    EquipmentSlotId.Amulet,
    EquipmentSlotId.Cloak,
    EquipmentSlotId.Relic,
  ];
  const slot = slots[scaledIndex(`${seed}:artifact:slot`, coord, slots.length)];
  const prefix = t(
    ARTIFACT_PREFIX_KEYS[
      scaledIndex(`${seed}:artifact:prefix`, coord, ARTIFACT_PREFIX_KEYS.length)
    ],
  );
  const form = t(
    ARTIFACT_FORM_KEYS[
      scaledIndex(`${seed}:artifact:form`, coord, ARTIFACT_FORM_KEYS.length)
    ],
  );
  return applyRarityToItem({
    id: itemId('artifact', coord, seed),
    slot,
    name: `${prefix} ${form}`,
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(
      seed,
      coord,
      tier + 1,
      minimumRarity ?? 'uncommon',
    ),
    power:
      slot === EquipmentSlotId.Relic
        ? tier + 1
        : slot === EquipmentSlotId.RingLeft ||
            slot === EquipmentSlotId.RingRight
          ? tier
          : 0,
    defense:
      slot === EquipmentSlotId.Cloak
        ? tier + 1
        : slot === EquipmentSlotId.Amulet
          ? tier
          : 0,
    maxHp:
      slot === EquipmentSlotId.Amulet || slot === EquipmentSlotId.Relic
        ? tier * 3
        : tier,
    healing: 0,
    hunger: 0,
    thirst: 0,
  });
}

function makeStructureState(structure: StructureType) {
  if (!isGatheringStructure(structure)) return undefined;
  const maxHp = structureDefinition(structure).maxHp;
  return { hp: maxHp, maxHp };
}
