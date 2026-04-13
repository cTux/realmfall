import { ARTIFACT_FORMS, ARTIFACT_PREFIXES, TOWN_SEARCH_LIMIT } from './config';
import { enemyIndexFromId, enemyKey, makeEnemy } from './combat';
import { makeConsumable } from './inventory';
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
import type {
  EquipmentSlot,
  GameState,
  GatheringStructureType,
  Item,
  ItemRarity,
  StructureType,
  Terrain,
  Tile,
} from './types';

export function cacheSafeStart(state: GameState) {
  const center = { q: 0, r: 0 };
  state.tiles[hexKey(center)] = buildTile(state.seed, center);
  hexNeighbors(center).forEach((coord) => {
    state.tiles[hexKey(coord)] = {
      coord,
      terrain: 'plains',
      items: [],
      structure: undefined,
      structureHp: undefined,
      structureMaxHp: undefined,
      enemyIds: [],
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
      state.enemies[enemyId] = makeEnemy(
        state.seed,
        coord,
        tile.terrain,
        enemyIndexFromId(enemyId),
        tile.structure,
        state.bloodMoonActive,
      );
    }
  });
}

export function buildTile(seed: string, coord: HexCoord): Tile {
  if (coord.q === 0 && coord.r === 0) {
    return {
      coord,
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: [],
    };
  }

  const terrain = pickTerrain(seed, coord);
  const structure = isPassable(terrain)
    ? pickStructure(seed, coord, terrain)
    : undefined;
  const structureStats = structure ? makeStructureState(structure) : undefined;
  const enemyIds = buildEnemyIds(seed, coord, terrain, structure);
  const items = maybeLoot(seed, coord, terrain, enemyIds.length > 0, structure);
  return {
    coord,
    terrain,
    structure,
    structureHp: structureStats?.hp,
    structureMaxHp: structureStats?.maxHp,
    items,
    enemyIds,
  };
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
  return (
    structure === 'herbs' ||
    structure === 'tree' ||
    structure === 'copper-ore' ||
    structure === 'iron-ore' ||
    structure === 'coal-ore' ||
    structure === 'pond' ||
    structure === 'lake'
  );
}

export function structureActionLabel(structure?: StructureType) {
  if (!structure) return null;
  switch (structure) {
    case 'herbs':
      return 'Gather herbs';
    case 'tree':
      return 'Chop tree';
    case 'copper-ore':
    case 'iron-ore':
    case 'coal-ore':
      return `Mine ${structureLabel(structure)}`;
    case 'pond':
    case 'lake':
      return `Fish ${structure}`;
    default:
      return null;
  }
}

export function describeStructure(structure?: StructureType) {
  if (!structure) return 'None';
  switch (structure) {
    case 'camp':
      return 'Campfire';
    case 'workshop':
      return 'Workshop';
    case 'copper-ore':
      return 'Copper Vein';
    case 'iron-ore':
      return 'Iron Vein';
    case 'coal-ore':
      return 'Coal Seam';
    case 'herbs':
      return 'Herb Patch';
    case 'tree':
      return 'Tree';
    case 'pond':
      return 'Pond';
    case 'lake':
      return 'Lake';
    default:
      return structure.charAt(0).toUpperCase() + structure.slice(1);
  }
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
  switch (structure) {
    case 'herbs':
      return {
        maxHp: 3,
        skill: 'crafting' as const,
        reward: 'Herbs',
        rewardTier: 1,
        baseYield: 2,
        verb: 'You gather the herb patch',
        depletedText: 'The herb patch is picked clean.',
      };
    case 'tree':
      return {
        maxHp: 5,
        skill: 'logging' as const,
        reward: 'Logs',
        rewardTier: 1,
        baseYield: 2,
        verb: 'You chop the tree',
        depletedText: 'The tree falls, leaving only a stump behind.',
      };
    case 'copper-ore':
      return {
        maxHp: 6,
        skill: 'mining' as const,
        reward: 'Copper Ore',
        rewardTier: 1,
        baseYield: 1,
        verb: 'You mine the copper vein',
        depletedText: 'The copper vein is spent.',
      };
    case 'iron-ore':
      return {
        maxHp: 8,
        skill: 'mining' as const,
        reward: 'Iron Ore',
        rewardTier: 2,
        baseYield: 1,
        verb: 'You mine the iron vein',
        depletedText: 'The iron vein is spent.',
      };
    case 'coal-ore':
      return {
        maxHp: 7,
        skill: 'mining' as const,
        reward: 'Coal',
        rewardTier: 2,
        baseYield: 1,
        verb: 'You mine the coal seam',
        depletedText: 'The coal seam is spent.',
      };
    case 'pond':
      return {
        maxHp: 4,
        skill: 'fishing' as const,
        reward: 'Raw Fish',
        rewardTier: 1,
        baseYield: 1,
        verb: 'You fish the pond',
        depletedText: 'The pond goes quiet for now.',
      };
    case 'lake':
      return {
        maxHp: 6,
        skill: 'fishing' as const,
        reward: 'Raw Fish',
        rewardTier: 2,
        baseYield: 2,
        verb: 'You fish the lake',
        depletedText: 'The lake settles after your catch.',
      };
  }
}

function buildEnemyIds(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  structure?: StructureType,
) {
  if (!isPassable(terrain)) return [];
  if (hexDistance(coord, { q: 0, r: 0 }) <= 1) return [];
  if (structure && structure !== 'dungeon') return [];
  if (structure === 'dungeon') {
    const count = 1 + scaledIndex(`${seed}:dungeon-count`, coord, 3);
    return Array.from({ length: count }, (_, index) => enemyKey(coord, index));
  }
  return shouldSpawnEnemy(seed, coord, terrain) ? [enemyKey(coord, 0)] : [];
}

function pickStructure(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
): StructureType | undefined {
  const roll = noise(`${seed}:structure`, coord);
  if (roll > 0.992) return 'dungeon';
  if (roll > 0.984) return 'forge';
  if (roll > 0.976) return 'town';
  if (roll > 0.968) return 'workshop';
  if (roll > 0.96) return 'camp';
  const resourceRoll = noise(`${seed}:resource-structure`, coord);
  if (terrain === 'forest' && resourceRoll > 0.55) return 'tree';
  if (terrain === 'desert' && resourceRoll > 0.76) return 'coal-ore';
  if (terrain === 'swamp' && resourceRoll > 0.72) return 'pond';
  if (terrain === 'plains' && resourceRoll > 0.82) return 'lake';
  if ((terrain === 'plains' || terrain === 'desert') && resourceRoll > 0.64)
    return 'copper-ore';
  if ((terrain === 'swamp' || terrain === 'forest') && resourceRoll > 0.7)
    return 'iron-ore';
  return undefined;
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
) {
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
    items.push(
      makeConsumable(`${hexKey(coord)}-cache`, 'Jerky Pack', tier, 6, 20),
    );
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
    'Trail Ration',
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
    kind: 'weapon',
    slot: 'weapon',
    name: `${prefixes[prefixIndex]} ${names[index]}`,
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(seed, coord, tier, minimumRarity),
    power: 2 + tier * 2,
    defense: 0,
    maxHp: tier >= 5 ? 1 : 0,
    healing: 0,
    hunger: 0,
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
    kind: 'armor',
    slot: 'offhand',
    name: names[index],
    quantity: 1,
    tier,
    rarity: pickEquipmentRarity(seed, coord, tier, minimumRarity),
    power: tier > 2 ? 1 : 0,
    defense: 1 + tier * 2,
    maxHp: tier,
    healing: 0,
    hunger: 0,
  });
}

export function makeArmor(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const slots: EquipmentSlot[] = ['head', 'chest', 'hands', 'legs', 'feet'];
  const slot = slots[scaledIndex(`${seed}:armor:slot`, coord, slots.length)];
  const names: Record<EquipmentSlot, string[]> = {
    weapon: [],
    offhand: [],
    head: ['Scout Hood', 'Iron Cap', 'Ranger Circlet'],
    chest: ['Warden Coat', 'Scale Vest', 'Nomad Harness'],
    hands: ['Grip Gloves', 'Hide Mitts', 'Bone Gauntlets'],
    legs: ['Trail Greaves', 'Strider Leggings', 'Dust Wraps'],
    feet: ['Dune Boots', 'Wolf Treads', 'Marsh Walkers'],
    ringLeft: [],
    ringRight: [],
    amulet: [],
    cloak: [],
    relic: [],
  };
  const slotNames = names[slot];
  const name =
    slotNames[scaledIndex(`${seed}:armor:name`, coord, slotNames.length)];
  return applyRarityToItem({
    id: itemId('armor', coord, seed),
    kind: 'armor',
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
  });
}

export function makeArtifact(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimumRarity?: ItemRarity,
): Item {
  const slots: EquipmentSlot[] = [
    'ringLeft',
    'ringRight',
    'amulet',
    'cloak',
    'relic',
  ];
  const slot = slots[scaledIndex(`${seed}:artifact:slot`, coord, slots.length)];
  const prefix =
    ARTIFACT_PREFIXES[
      scaledIndex(`${seed}:artifact:prefix`, coord, ARTIFACT_PREFIXES.length)
    ];
  const form =
    ARTIFACT_FORMS[
      scaledIndex(`${seed}:artifact:form`, coord, ARTIFACT_FORMS.length)
    ];
  return applyRarityToItem({
    id: itemId('artifact', coord, seed),
    kind: 'artifact',
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
    power: slot === 'relic' ? tier + 1 : slot.includes('ring') ? tier : 0,
    defense: slot === 'cloak' ? tier + 1 : slot === 'amulet' ? tier : 0,
    maxHp: slot === 'amulet' || slot === 'relic' ? tier * 3 : tier,
    healing: 0,
    hunger: 0,
  });
}

function makeStructureState(structure: StructureType) {
  if (!isGatheringStructure(structure)) return undefined;
  const maxHp = structureDefinition(structure).maxHp;
  return { hp: maxHp, maxHp };
}

function structureLabel(structure: GatheringStructureType) {
  switch (structure) {
    case 'herbs':
      return 'herb patch';
    case 'copper-ore':
      return 'copper vein';
    case 'iron-ore':
      return 'iron vein';
    case 'coal-ore':
      return 'coal seam';
    default:
      return structure;
  }
}
