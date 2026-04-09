import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { createRng } from './random';

export { hexAtPoint, hexDistance } from './hex';
export type { HexCoord } from './hex';

export type Terrain =
  | 'plains'
  | 'forest'
  | 'water'
  | 'mountain'
  | 'desert'
  | 'swamp';

export type EquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'ringLeft'
  | 'ringRight'
  | 'amulet'
  | 'cloak'
  | 'relic';

export type ItemKind =
  | 'weapon'
  | 'armor'
  | 'artifact'
  | 'consumable'
  | 'resource';

export interface Item {
  id: string;
  kind: ItemKind;
  slot?: EquipmentSlot;
  name: string;
  quantity: number;
  tier: number;
  power: number;
  defense: number;
  maxHp: number;
  healing: number;
  hunger: number;
}

export interface Enemy {
  id: string;
  name: string;
  coord: HexCoord;
  tier: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
}

export interface Tile {
  coord: HexCoord;
  terrain: Terrain;
  items: Item[];
  enemyId?: string;
}

export type Equipment = Partial<Record<EquipmentSlot, Item>>;

export interface Player {
  coord: HexCoord;
  level: number;
  xp: number;
  gold: number;
  hp: number;
  baseMaxHp: number;
  mana: number;
  baseMaxMana: number;
  hunger: number;
  baseAttack: number;
  baseDefense: number;
  inventory: Item[];
  equipment: Equipment;
}

export interface GameState {
  seed: string;
  radius: number;
  turn: number;
  gameOver: boolean;
  logSequence: number;
  logs: LogEntry[];
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
  player: Player;
}

export type LogKind =
  | 'movement'
  | 'combat'
  | 'loot'
  | 'survival'
  | 'rumor'
  | 'motd'
  | 'system';

export interface LogEntry {
  id: string;
  kind: LogKind;
  text: string;
  turn: number;
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon',
  'offhand',
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
  'ringLeft',
  'ringRight',
  'amulet',
  'cloak',
  'relic',
];

const ARTIFACT_PREFIXES = [
  'Ashen',
  'Auric',
  'Blood',
  'Cinder',
  'Dawn',
  'Echo',
  'Frost',
  'Gloom',
  'Iron',
  'Lunar',
  'Moss',
  'Night',
];

const ARTIFACT_FORMS = ['Idol', 'Sigil', 'Charm', 'Lens', 'Shard', 'Totem'];

export function createGame(
  radius = 6,
  seed = `world-${Date.now()}`,
): GameState {
  const state: GameState = {
    seed,
    radius,
    turn: 0,
    gameOver: false,
    logSequence: 3,
    logs: createInitialLogs(seed),
    tiles: {},
    enemies: {},
    player: {
      coord: { q: 0, r: 0 },
      level: 1,
      xp: 0,
      gold: 0,
      hp: 30,
      baseMaxHp: 30,
      mana: 12,
      baseMaxMana: 12,
      hunger: 100,
      baseAttack: 4,
      baseDefense: 1,
      inventory: [
        makeStarterWeapon(),
        makeStarterArmor('chest', 'Scout Jerkin', 1, 1),
        makeConsumable('starter-ration', 'Trail Ration', 1, 10, 15, 2),
      ],
      equipment: {},
    },
  };

  cacheSafeStart(state);
  return state;
}

export function getVisibleTiles(state: GameState) {
  const tiles: Tile[] = [];
  const { q: pq, r: pr } = state.player.coord;

  for (let dq = -state.radius; dq <= state.radius; dq += 1) {
    for (let dr = -state.radius; dr <= state.radius; dr += 1) {
      if (Math.abs(dq + dr) > state.radius) continue;
      tiles.push(getTileAt(state, { q: pq + dq, r: pr + dr }));
    }
  }

  return tiles;
}

export function getTileAt(state: GameState, coord: HexCoord) {
  return state.tiles[hexKey(coord)] ?? buildTile(state.seed, coord);
}

export function getEnemyAt(state: GameState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  if (!tile.enemyId) return undefined;
  return (
    state.enemies[tile.enemyId] ?? makeEnemy(state.seed, coord, tile.terrain)
  );
}

export function getPlayerStats(player: Player) {
  const equipped = Object.values(player.equipment);
  const attackBonus = equipped.reduce(
    (sum, item) => sum + (item?.power ?? 0),
    0,
  );
  const defenseBonus = equipped.reduce(
    (sum, item) => sum + (item?.defense ?? 0),
    0,
  );
  const maxHpBonus = equipped.reduce(
    (sum, item) => sum + (item?.maxHp ?? 0),
    0,
  );
  const nextLevelXp = levelThreshold(player.level);
  const maxHp = player.baseMaxHp + maxHpBonus;
  const hungerPenalty =
    player.hunger >= 70
      ? 0
      : player.hunger >= 40
        ? 1
        : player.hunger >= 15
          ? 2
          : 3;

  return {
    hp: player.hp,
    maxHp,
    mana: player.mana,
    maxMana: player.baseMaxMana,
    attack: Math.max(0, player.baseAttack + attackBonus - hungerPenalty),
    defense: Math.max(0, player.baseDefense + defenseBonus - hungerPenalty),
    hungerPenalty,
    level: player.level,
    xp: player.xp,
    nextLevelXp,
  };
}

export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1) {
    return message(state, 'Move one hex at a time.');
  }

  const next = clone(state);
  ensureTileState(next, target);
  const tile = next.tiles[hexKey(target)];

  if (!isPassable(tile.terrain)) {
    return message(next, 'The terrain blocks your path.');
  }

  next.turn += 1;
  next.player.hunger = Math.max(0, next.player.hunger - 1);

  if (next.player.hunger === 0) {
    next.player.hp = Math.max(0, next.player.hp - 1);
    addLog(next, 'survival', 'You are starving.');
    if (next.player.hp <= 0) {
      next.gameOver = true;
      addLog(next, 'combat', 'You were defeated.');
      return next;
    }
  }

  const enemy = tile.enemyId ? next.enemies[tile.enemyId] : undefined;
  if (enemy) {
    const damage = Math.max(
      1,
      getPlayerStats(next.player).attack - enemy.defense,
    );
    enemy.hp -= damage;
    addLog(next, 'combat', `You strike the ${enemy.name} for ${damage}.`);

    if (enemy.hp <= 0) {
      delete next.enemies[enemy.id];
      next.tiles[hexKey(target)] = { ...tile, enemyId: undefined };
      next.player.coord = target;
      gainXp(next, enemy.xp);
      addLog(next, 'combat', `You defeated the ${enemy.name}.`);
      pickUpLoot(next, target);
    } else {
      const retaliation = Math.max(
        1,
        enemy.attack - getPlayerStats(next.player).defense,
      );
      next.player.hp = Math.max(0, next.player.hp - retaliation);
      addLog(next, 'combat', `The ${enemy.name} hits back for ${retaliation}.`);
      if (next.player.hp <= 0) {
        next.gameOver = true;
        addLog(next, 'combat', 'You were defeated.');
      }
    }

    return next;
  }

  next.player.coord = target;
  pickUpLoot(next, target);
  addLog(next, 'movement', `You travel to ${target.q}, ${target.r}.`);
  return next;
}

export function equipItem(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, 'That item is not in your pack.');

  const item = state.player.inventory[itemIndex];
  const next = clone(state);

  if (item.kind === 'consumable') {
    if (item.quantity > 1) {
      next.player.inventory[itemIndex] = {
        ...item,
        quantity: item.quantity - 1,
      };
    } else {
      next.player.inventory.splice(itemIndex, 1);
    }
    const maxHp = getPlayerStats(next.player).maxHp;
    next.player.hp = Math.min(maxHp, next.player.hp + item.healing);
    next.player.hunger = Math.min(100, next.player.hunger + item.hunger);
    addLog(
      next,
      'survival',
      `You use ${item.name}${item.healing > 0 ? ` and recover ${item.healing} HP` : ''}${
        item.hunger > 0 ? ` and ${item.hunger} hunger` : ''
      }.`,
    );
    return next;
  }

  next.player.inventory.splice(itemIndex, 1);

  if (!item.slot) return message(state, 'That item cannot be equipped.');

  const replaced = next.player.equipment[item.slot];
  if (replaced) next.player.inventory.push(replaced);
  next.player.equipment[item.slot] = item;
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'system', `You equip ${item.name} in ${item.slot}.`);
  return next;
}

export function unequipItem(state: GameState, slot: EquipmentSlot): GameState {
  if (state.gameOver) return state;

  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, 'That slot is already empty.');

  const next = clone(state);
  delete next.player.equipment[slot];
  addItemToInventory(next.player.inventory, equipped);
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'system', `You unequip ${equipped.name}.`);
  return next;
}

export function sortInventory(state: GameState): GameState {
  const next = clone(state);
  const equippable = next.player.inventory
    .filter(isEquippableItem)
    .sort(compareItems);
  const other = next.player.inventory.filter((item) => !isEquippableItem(item));
  next.player.inventory = [...equippable, ...other];
  addLog(next, 'system', 'You sort your inventory.');
  return next;
}

export function sellAllItems(state: GameState): GameState {
  const sellable = state.player.inventory.filter(isEquippableItem);
  if (sellable.length === 0)
    return message(state, 'No equippable items to sell.');

  const next = clone(state);
  const gold = sellable.reduce((sum, item) => sum + sellValue(item), 0);
  next.player.gold += gold;
  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item),
  );
  addLog(next, 'system', `You sell your spare gear for ${gold} gold.`);
  return next;
}

export function prospectInventory(state: GameState): GameState {
  const next = clone(state);
  const prospectable = next.player.inventory.filter(
    (item) => item.kind !== 'consumable' && item.kind !== 'resource',
  );

  if (prospectable.length === 0) {
    return message(state, 'Nothing in your pack can be prospected.');
  }

  next.player.inventory = next.player.inventory.filter(
    (item) => item.kind === 'consumable' || item.kind === 'resource',
  );

  prospectable.forEach((item) => {
    prospectYield(item).forEach((resource) =>
      addItemToInventory(next.player.inventory, resource),
    );
  });

  next.player.inventory.sort(compareItems);
  addLog(next, 'loot', 'You prospect your spare gear into raw materials.');
  return next;
}

function cacheSafeStart(state: GameState) {
  const center = { q: 0, r: 0 };
  state.tiles[hexKey(center)] = buildTile(state.seed, center);

  hexNeighbors(center).forEach((coord) => {
    state.tiles[hexKey(coord)] = {
      coord,
      terrain: 'plains',
      items: [],
      enemyId: undefined,
    };
  });
}

function ensureTileState(state: GameState, coord: HexCoord) {
  const key = hexKey(coord);
  if (!state.tiles[key]) {
    const tile = buildTile(state.seed, coord);
    state.tiles[key] = tile;
    if (tile.enemyId) {
      state.enemies[tile.enemyId] = makeEnemy(state.seed, coord, tile.terrain);
    }
  } else {
    const tile = state.tiles[key];
    if (tile.enemyId && !state.enemies[tile.enemyId]) {
      state.enemies[tile.enemyId] = makeEnemy(state.seed, coord, tile.terrain);
    }
  }
}

function buildTile(seed: string, coord: HexCoord): Tile {
  if (coord.q === 0 && coord.r === 0) {
    return { coord, terrain: 'plains', items: [], enemyId: undefined };
  }

  const terrain = pickTerrain(seed, coord);
  const enemyId = shouldSpawnEnemy(seed, coord, terrain)
    ? enemyKey(coord)
    : undefined;
  const items = maybeLoot(seed, coord, terrain, Boolean(enemyId));
  return { coord, terrain, items, enemyId };
}

function shouldSpawnEnemy(seed: string, coord: HexCoord, terrain: Terrain) {
  if (!isPassable(terrain)) return false;
  if (hexDistance(coord, { q: 0, r: 0 }) <= 1) return false;
  return noise(`${seed}:enemy:spawn`, coord) > 0.8;
}

function pickTerrain(seed: string, coord: HexCoord): Terrain {
  const roll = noise(seed, coord);
  if (roll < 0.1) return 'water';
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
) {
  const roll = noise(`${seed}:loot`, coord);
  const tier = terrainTier(coord, terrain);
  const lootChance = guarded ? Math.max(0.52, 0.7 - tier * 0.02) : 0.965;
  if (roll < lootChance) return [];

  const items: Item[] = [];
  items.push(makeGeneratedItem(seed, coord, tier, roll));

  if (roll > 0.95) {
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
) {
  if (roll > 0.985) return makeResource(seed, coord, tier);
  if (roll > 0.92 || tier >= 7) return makeArtifact(seed, coord, tier);
  if (roll > 0.82) return makeWeapon(seed, coord, tier + (tier >= 6 ? 1 : 0));
  if (roll > 0.72) return makeOffhand(seed, coord, tier);
  if (roll > 0.66) return makeArmor(seed, coord, tier);
  return makeConsumable(
    itemId('consumable', coord, seed),
    'Trail Ration',
    tier,
    8,
    12,
  );
}

function makeEnemy(seed: string, coord: HexCoord, terrain: Terrain): Enemy {
  const tier = terrainTier(coord, terrain);
  const roll = noise(`${seed}:enemy:type`, coord);
  return {
    id: enemyKey(coord),
    name: roll > 0.66 ? 'Raider' : roll > 0.33 ? 'Wolf' : 'Marauder',
    coord,
    tier,
    maxHp: 8 + tier * 6,
    hp: 8 + tier * 6,
    attack: 2 + tier * 2,
    defense: 1 + tier,
    xp: 18 + tier * 14,
  };
}

function makeWeapon(seed: string, coord: HexCoord, tier: number): Item {
  const names = ['Blade', 'Spear', 'Axe', 'Bow', 'Glaive', 'Hammer'];
  const prefixes = ['Hunter', 'Warden', 'Drifter', 'Riven', 'Storm', 'Ember'];
  const index = scaledIndex(`${seed}:weapon`, coord, names.length);
  const prefixIndex = scaledIndex(
    `${seed}:weapon:prefix`,
    coord,
    prefixes.length,
  );
  return {
    id: itemId('weapon', coord, seed),
    kind: 'weapon',
    slot: 'weapon',
    name: `${prefixes[prefixIndex]} ${names[index]}`,
    quantity: 1,
    tier,
    power: 2 + tier * 2,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function makeOffhand(seed: string, coord: HexCoord, tier: number): Item {
  const names = ['Buckler', 'Lantern Shield', 'Mirror Guard', 'Ward Board'];
  const index = scaledIndex(`${seed}:offhand`, coord, names.length);
  return {
    id: itemId('offhand', coord, seed),
    kind: 'armor',
    slot: 'offhand',
    name: names[index],
    quantity: 1,
    tier,
    power: tier > 2 ? 1 : 0,
    defense: 1 + tier * 2,
    maxHp: tier,
    healing: 0,
    hunger: 0,
  };
}

function makeArmor(seed: string, coord: HexCoord, tier: number): Item {
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
  return makeStarterArmor(slot, name, tier, 1 + tier);
}

function makeArtifact(seed: string, coord: HexCoord, tier: number): Item {
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
  return {
    id: itemId('artifact', coord, seed),
    kind: 'artifact',
    slot,
    name: `${prefix} ${form}`,
    quantity: 1,
    tier,
    power: slot === 'relic' ? tier + 1 : slot.includes('ring') ? tier : 0,
    defense: slot === 'cloak' ? tier + 1 : slot === 'amulet' ? tier : 0,
    maxHp: slot === 'amulet' || slot === 'relic' ? tier * 3 : tier,
    healing: 0,
    hunger: 0,
  };
}

function makeResource(seed: string, coord: HexCoord, tier: number): Item {
  const names = ['Herbs', 'Logs', 'Stone', 'Copper Ore', 'Iron Ore', 'Coal'];
  const name = names[scaledIndex(`${seed}:resource:name`, coord, names.length)];
  const quantity =
    2 +
    scaledIndex(`${seed}:resource:quantity`, coord, 5) +
    Math.floor(tier / 3);
  return {
    id: `resource-${hexKey(coord)}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    kind: 'resource',
    name,
    quantity,
    tier,
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function makeStarterWeapon(): Item {
  return {
    id: 'starter-knife',
    kind: 'weapon',
    slot: 'weapon',
    name: 'Rust Knife',
    quantity: 1,
    tier: 1,
    power: 2,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function makeStarterArmor(
  slot: EquipmentSlot,
  name: string,
  tier: number,
  defense: number,
): Item {
  return {
    id: `${slot}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    kind: 'armor',
    slot,
    name,
    quantity: 1,
    tier,
    power: 0,
    defense,
    maxHp: tier,
    healing: 0,
    hunger: 0,
  };
}

function makeConsumable(
  id: string,
  name: string,
  tier: number,
  healing: number,
  hunger: number,
  quantity = 1,
): Item {
  return {
    id,
    kind: 'consumable',
    name,
    quantity,
    tier,
    power: 0,
    defense: 0,
    maxHp: 0,
    healing,
    hunger,
  };
}

function pickUpLoot(state: GameState, coord: HexCoord) {
  ensureTileState(state, coord);
  const tile = state.tiles[hexKey(coord)];
  if (tile.items.length === 0) return;
  tile.items.forEach((item) =>
    addItemToInventory(state.player.inventory, item),
  );
  state.tiles[hexKey(coord)] = { ...tile, items: [] };
  addLog(
    state,
    'loot',
    `You found ${tile.items.map((item) => item.name).join(', ')}.`,
  );
}

function gainXp(state: GameState, amount: number) {
  state.player.xp += amount;
  while (state.player.xp >= levelThreshold(state.player.level)) {
    state.player.xp -= levelThreshold(state.player.level);
    state.player.level += 1;
    state.player.baseMaxHp += 6;
    state.player.baseMaxMana += 2;
    state.player.baseAttack += 1;
    state.player.baseDefense += 1;
    state.player.hp = getPlayerStats(state.player).maxHp;
    state.player.mana = state.player.baseMaxMana;
    addLog(state, 'system', `You reached level ${state.player.level}.`);
  }
}

function levelThreshold(level: number) {
  return 40 + level * 25;
}

function terrainTier(coord: HexCoord, terrain: Terrain) {
  const distance = Math.floor(hexDistance(coord, { q: 0, r: 0 }) / 4);
  const terrainBonus = terrain === 'mountain' ? 2 : terrain === 'swamp' ? 1 : 0;
  return 1 + distance + terrainBonus;
}

function isPassable(terrain: Terrain) {
  return terrain !== 'water' && terrain !== 'mountain';
}

function message(state: GameState, text: string): GameState {
  const next = clone(state);
  addLog(next, 'system', text);
  return next;
}

function enemyKey(coord: HexCoord) {
  return `enemy-${hexKey(coord)}`;
}

function itemId(kind: string, coord: HexCoord, seed: string) {
  return `${kind}-${hexKey(coord)}-${Math.floor(noise(`${seed}:${kind}:id`, coord) * 100000)}`;
}

function scaledIndex(seed: string, coord: HexCoord, size: number) {
  return Math.floor(noise(seed, coord) * size) % size;
}

function clone(state: GameState): GameState {
  return {
    ...state,
    logSequence: state.logSequence,
    logs: [...state.logs],
    tiles: Object.fromEntries(
      Object.entries(state.tiles).map(([key, tile]) => [
        key,
        { ...tile, items: tile.items.map((item) => ({ ...item })) },
      ]),
    ),
    enemies: Object.fromEntries(
      Object.entries(state.enemies).map(([key, enemy]) => [key, { ...enemy }]),
    ),
    player: {
      ...state.player,
      coord: { ...state.player.coord },
      inventory: state.player.inventory.map((item) => ({ ...item })),
      equipment: Object.fromEntries(
        Object.entries(state.player.equipment).map(([key, item]) => [
          key,
          item ? { ...item } : item,
        ]),
      ),
    },
  };
}

function addItemToInventory(inventory: Item[], item: Item) {
  if (item.kind !== 'consumable' && item.kind !== 'resource') {
    inventory.push(item);
    return;
  }

  const existing = inventory.find((entry) => isSameConsumable(entry, item));
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  inventory.push(item);
}

function compareItems(left: Item, right: Item) {
  const kindOrder = ['resource', 'consumable', 'artifact', 'armor', 'weapon'];
  const kindDelta =
    kindOrder.indexOf(left.kind) - kindOrder.indexOf(right.kind);
  if (kindDelta !== 0) return kindDelta;
  if (right.tier !== left.tier) return right.tier - left.tier;
  return left.name.localeCompare(right.name);
}

function isEquippableItem(item: Item) {
  return (
    item.kind === 'weapon' || item.kind === 'armor' || item.kind === 'artifact'
  );
}

function sellValue(item: Item) {
  const base =
    item.kind === 'artifact'
      ? 16
      : item.kind === 'weapon'
        ? 10
        : item.kind === 'armor'
          ? 8
          : item.kind === 'resource'
            ? 2
            : 3;
  return (base + item.tier * 2) * item.quantity;
}

function prospectYield(item: Item): Item[] {
  const quantity = Math.max(1, Math.ceil(item.tier / 2));
  if (item.kind === 'weapon') {
    return [
      makeResourceStack('Iron Chunks', item.tier, quantity),
      makeResourceStack('Sticks', item.tier, 1),
    ];
  }
  if (item.kind === 'armor') {
    return [
      makeResourceStack(
        item.slot === 'chest' ? 'Cloth' : 'Leather Scraps',
        item.tier,
        quantity,
      ),
      makeResourceStack('Iron Chunks', item.tier, 1),
    ];
  }
  return [makeResourceStack('Arcane Dust', item.tier, quantity + 1)];
}

function makeResourceStack(name: string, tier: number, quantity: number): Item {
  return {
    id: `resource-${name.toLowerCase().replace(/\s+/g, '-')}-${tier}`,
    kind: 'resource',
    name,
    quantity,
    tier,
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function isSameConsumable(left: Item, right: Item) {
  return (
    (left.kind === 'consumable' || left.kind === 'resource') &&
    left.kind === right.kind &&
    left.name === right.name &&
    left.tier === right.tier &&
    left.healing === right.healing &&
    left.hunger === right.hunger
  );
}

function createInitialLogs(seed: string): LogEntry[] {
  return [
    makeLog(
      3,
      'motd',
      0,
      'MOTD: The world never ends, but your supplies absolutely do.',
    ),
    makeLog(2, 'rumor', 0, rumorForSeed(seed)),
    makeLog(1, 'system', 0, 'You wake in an endless hostile hex world.'),
  ];
}

function addLog(state: GameState, kind: LogKind, text: string) {
  state.logSequence += 1;
  state.logs = [
    makeLog(state.logSequence, kind, state.turn, text),
    ...state.logs,
  ].slice(0, 250);
}

function makeLog(
  sequence: number,
  kind: LogKind,
  turn: number,
  text: string,
): LogEntry {
  return {
    id: `l-${sequence}`,
    kind,
    text,
    turn,
  };
}

function rumorForSeed(seed: string) {
  const rumors = [
    'Rumor: the best relics show up where the marches have already taken a toll on weaker travelers.',
    'Rumor: raiders beyond the tenth ring fight like veterans and dress like kings.',
    'Rumor: swamp relics tend to harden the body, desert relics tend to sharpen the hand.',
    'Rumor: if you return alive from far enough out, your pack will not be empty.',
  ];
  return (
    rumors[Math.floor(createRng(`${seed}:rumor`)() * rumors.length)] ??
    rumors[0]
  );
}

function noise(seed: string, coord: HexCoord) {
  const rng = createRng(`${seed}:${coord.q}:${coord.r}`);
  return rng();
}
