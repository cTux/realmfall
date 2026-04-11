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
export type GatheringStructureType =
  | 'tree'
  | 'copper-ore'
  | 'iron-ore'
  | 'coal-ore'
  | 'pond'
  | 'lake';
export type StructureType =
  | 'forge'
  | 'camp'
  | 'workshop'
  | 'town'
  | 'dungeon'
  | GatheringStructureType;
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SkillName =
  | 'logging'
  | 'mining'
  | 'skinning'
  | 'fishing'
  | 'cooking'
  | 'crafting';

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
  recipeId?: string;
  slot?: EquipmentSlot;
  name: string;
  quantity: number;
  tier: number;
  rarity: ItemRarity;
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
  elite: boolean;
}

export interface Tile {
  coord: HexCoord;
  terrain: Terrain;
  structure?: StructureType;
  structureHp?: number;
  structureMaxHp?: number;
  items: Item[];
  enemyIds: string[];
}

export type Equipment = Partial<Record<EquipmentSlot, Item>>;

export interface Player {
  coord: HexCoord;
  level: number;
  masteryLevel: number;
  xp: number;
  hp: number;
  baseMaxHp: number;
  mana: number;
  baseMaxMana: number;
  hunger: number;
  baseAttack: number;
  baseDefense: number;
  skills: Record<SkillName, SkillProgress>;
  learnedRecipeIds: string[];
  inventory: Item[];
  equipment: Equipment;
}

export interface SkillProgress {
  level: number;
  xp: number;
}

export interface CombatState {
  coord: HexCoord;
  enemyIds: string[];
}

export interface TownStockEntry {
  item: Item;
  price: number;
}

export interface RecipeRequirement {
  name: string;
  quantity: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  skill: Extract<SkillName, 'cooking' | 'crafting'>;
  output: Item;
  ingredients: RecipeRequirement[];
  fuelOptions?: RecipeRequirement[];
}

export interface GameState {
  seed: string;
  radius: number;
  turn: number;
  worldTimeMs: number;
  gameOver: boolean;
  logSequence: number;
  logs: LogEntry[];
  tiles: Record<string, Tile>;
  enemies: Record<string, Enemy>;
  player: Player;
  combat: CombatState | null;
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

export const RARITY_ORDER: ItemRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

const RECIPE_BOOK_ITEM_NAME = 'Recipe Book';
const COOKED_FISH_ITEM_NAME = 'Cooked Fish';
const STARTING_RECIPE_IDS = ['cook-cooked-fish'];

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
const TOWN_SEARCH_LIMIT = 24;

export function createGame(
  radius = 8,
  seed = `world-${Date.now()}`,
): GameState {
  const state: GameState = {
    seed,
    radius,
    turn: 0,
    worldTimeMs: 0,
    gameOver: false,
    logSequence: 3,
    logs: createFreshLogs(seed),
    tiles: {},
    enemies: {},
    combat: null,
    player: {
      coord: { q: 0, r: 0 },
      level: 1,
      masteryLevel: 0,
      xp: 0,
      hp: 30,
      baseMaxHp: 30,
      mana: 12,
      baseMaxMana: 12,
      hunger: 100,
      baseAttack: 4,
      baseDefense: 1,
      skills: makeStartingSkills(),
      learnedRecipeIds: [...STARTING_RECIPE_IDS],
      inventory: [
        makeStarterWeapon(),
        makeStarterArmor('chest', 'Scout Jerkin', 1, 1),
        makeConsumable('starter-ration', 'Trail Ration', 1, 10, 15, 2),
        makeRecipeBook(),
      ],
      equipment: {},
    },
  };

  cacheSafeStart(state);
  return state;
}

export function createFreshLogs(seed: string) {
  return createInitialLogs(seed);
}

export function getRecipeBookRecipes(
  learnedRecipeIds?: string[],
): RecipeDefinition[] {
  const visibleRecipes = learnedRecipeIds
    ? RECIPE_BOOK_RECIPES.filter((recipe) =>
        learnedRecipeIds.includes(recipe.id),
      )
    : RECIPE_BOOK_RECIPES;

  return visibleRecipes.map((recipe) => ({
    ...recipe,
    output: { ...recipe.output },
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
    fuelOptions: recipe.fuelOptions?.map((option) => ({ ...option })),
  }));
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

export function getCurrentTile(state: GameState) {
  return getTileAt(state, state.player.coord);
}

export function getEnemiesAt(state: GameState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  return tile.enemyIds
    .map(
      (enemyId) =>
        state.enemies[enemyId] ??
        makeEnemy(
          state.seed,
          coord,
          tile.terrain,
          enemyIndexFromId(enemyId),
          tile.structure,
        ),
    )
    .filter(Boolean);
}

export function getEnemyAt(state: GameState, coord: HexCoord) {
  return getEnemiesAt(state, coord)[0];
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
  const nextLevelXp =
    player.level >= MAX_PLAYER_LEVEL
      ? masteryLevelThreshold(player.masteryLevel)
      : levelThreshold(player.level);
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
    masteryLevel: player.masteryLevel,
    xp: player.xp,
    nextLevelXp,
    skills: player.skills,
  };
}

export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;
  if (state.combat) return message(state, 'Finish the current battle first.');

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1)
    return message(state, 'Move one hex at a time.');

  const next = clone(state);
  ensureTileState(next, target);
  const tile = next.tiles[hexKey(target)];

  if (!isPassable(tile.terrain))
    return message(next, 'The terrain blocks your path.');

  next.turn += 1;
  next.player.hunger = Math.max(0, next.player.hunger - 1);
  next.player.coord = target;

  if (next.player.hunger === 0) {
    next.player.hp = Math.max(0, next.player.hp - 1);
    addLog(next, 'survival', 'You are starving.');
    if (next.player.hp <= 0) {
      respawnAtNearestTown(next, target);
      return next;
    }
  }

  if (tile.enemyIds.length > 0) {
    next.combat = { coord: target, enemyIds: [...tile.enemyIds] };
    addLog(
      next,
      'combat',
      `You engage ${tile.enemyIds.length} foe${tile.enemyIds.length > 1 ? 's' : ''}.`,
    );
    return next;
  }

  addLog(next, 'movement', `You travel to ${target.q}, ${target.r}.`);
  return next;
}

export function attackCombatEnemy(
  state: GameState,
  enemyId: string,
): GameState {
  if (!state.combat) return message(state, 'There is no active battle.');

  const next = clone(state);
  const enemy = next.enemies[enemyId];
  if (!enemy) return message(state, 'That enemy is already defeated.');

  const playerStats = getPlayerStats(next.player);
  const damage = Math.max(1, playerStats.attack - enemy.defense);
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(next, 'combat', `You strike the ${enemy.name} for ${damage}.`);

  if (enemy.hp <= 0) {
    gainXp(next, enemy.xp);
    maybeDropEnemyGold(next, enemy);
    maybeDropEnemyRecipe(next, enemy);
    maybeSkinEnemy(next, enemy);
    addLog(next, 'combat', `You defeated the ${enemy.name}.`);
    delete next.enemies[enemy.id];
  }

  syncCombatEnemies(next);

  if (!next.combat) return next;

  const survivingEnemies = next.combat.enemyIds
    .map((id) => next.enemies[id])
    .filter(Boolean);
  survivingEnemies.forEach((foe) => {
    const retaliation = Math.max(
      1,
      foe.attack - getPlayerStats(next.player).defense,
    );
    next.player.hp = Math.max(0, next.player.hp - retaliation);
    addLog(next, 'combat', `The ${foe.name} hits back for ${retaliation}.`);
  });

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, state.combat.coord);
  }

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
    consumeItem(next, itemIndex, item);
    return next;
  }

  if (item.kind === 'resource')
    return message(state, 'Resources cannot be equipped.');

  next.player.inventory.splice(itemIndex, 1);
  if (!item.slot) return message(state, 'That item cannot be equipped.');

  const replaced = next.player.equipment[item.slot];
  if (replaced) addItemToInventory(next.player.inventory, replaced);
  next.player.equipment[item.slot] = item;
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'system', `You equip ${item.name} in ${item.slot}.`);
  return next;
}

export function useItem(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, 'That item is not in your pack.');

  const item = state.player.inventory[itemIndex];
  if (isRecipeBook(item))
    return message(state, 'Open the recipe book from your pack.');
  if (isRecipePage(item)) {
    const next = clone(state);
    learnRecipe(next, item);
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    return next;
  }
  if (item.kind !== 'consumable')
    return message(state, 'That item cannot be used.');

  const next = clone(state);
  consumeItem(next, itemIndex, item);
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
  next.player.inventory = consolidateInventory(next.player.inventory);
  const equippable = next.player.inventory
    .filter(isEquippableItem)
    .sort(compareItems);
  const other = next.player.inventory.filter((item) => !isEquippableItem(item));
  next.player.inventory = [...equippable, ...other];
  addLog(next, 'system', 'You sort your inventory.');
  return next;
}

export function sellAllItems(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'town')
    return message(state, 'You can sell only while standing in town.');
  const sellable = state.player.inventory.filter(isEquippableItem);
  if (sellable.length === 0)
    return message(state, 'No equippable items to sell.');

  const next = clone(state);
  const gold = sellable.reduce((sum, item) => sum + sellValue(item), 0);
  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item),
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(next, 'system', `You sell your spare gear for ${gold} gold.`);
  return next;
}

export function prospectInventory(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'forge')
    return message(state, 'You can prospect only while standing at a forge.');

  const next = clone(state);
  const prospectable = next.player.inventory.filter(isEquippableItem);
  if (prospectable.length === 0)
    return message(state, 'Nothing in your pack can be prospected.');

  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item),
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

export function takeTileItem(state: GameState, itemId: string): GameState {
  const next = clone(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  const itemIndex = tile.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) return message(state, 'That item is no longer here.');

  const [item] = tile.items.splice(itemIndex, 1);
  addItemToInventory(next.player.inventory, item);
  next.tiles[key] = normalizeStructureState({
    ...tile,
    items: [...tile.items],
  });
  addLog(next, 'loot', `You take ${describeItemStack(item)}.`);
  return next;
}

export function interactWithStructure(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) return message(state, 'Finish the current battle first.');

  const tile = getCurrentTile(state);
  if (!isGatheringStructure(tile.structure))
    return message(state, 'There is nothing here to gather.');

  const next = clone(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const currentTile = next.tiles[key];
  if (!isGatheringStructure(currentTile.structure))
    return message(state, 'There is nothing here to gather.');

  next.turn += 1;
  next.player.hunger = Math.max(0, next.player.hunger - 1);

  if (next.player.hunger === 0) {
    next.player.hp = Math.max(0, next.player.hp - 1);
    addLog(next, 'survival', 'You are starving.');
    if (next.player.hp <= 0) {
      respawnAtNearestTown(next, next.player.coord);
      return next;
    }
  }

  const definition = structureDefinition(currentTile.structure);
  const skill = next.player.skills[definition.skill];
  const damage = Math.min(
    currentTile.structureHp ?? definition.maxHp,
    1 + Math.floor(skill.level / 3),
  );
  const bonusLoot = rollGatheringBonus(next, definition.skill);
  const quantity =
    definition.baseYield + Math.floor((skill.level - 1) / 4) + bonusLoot;

  currentTile.structureHp = Math.max(
    0,
    (currentTile.structureHp ?? definition.maxHp) - damage,
  );
  addItemToInventory(
    next.player.inventory,
    makeResourceStack(definition.reward, definition.rewardTier, quantity),
  );
  gainSkillXp(next, definition.skill, damage);

  addLog(
    next,
    'loot',
    `${definition.verb} and bring in ${describeItemStack(makeResourceStack(definition.reward, definition.rewardTier, quantity))}.`,
  );
  if (bonusLoot > 0) {
    addLog(
      next,
      'system',
      `Your ${definition.skill} skill nets extra ${definition.reward.toLowerCase()}.`,
    );
  }

  if (currentTile.structureHp <= 0) {
    addLog(next, 'system', `${definition.depletedText}`);
  }

  next.tiles[key] = normalizeStructureState({
    ...currentTile,
    items: [...currentTile.items],
  });
  return next;
}

export function getTownStock(state: GameState): TownStockEntry[] {
  const tile = getCurrentTile(state);
  if (tile.structure !== 'town') return [];
  return buildTownStock(state.seed, tile.coord);
}

export function hasEquippableInventoryItems(state: GameState) {
  return state.player.inventory.some(isEquippableItem);
}

export function buyTownItem(state: GameState, itemId: string): GameState {
  const tile = getCurrentTile(state);
  if (tile.structure !== 'town')
    return message(state, 'You can buy only while standing in town.');

  const stock = buildTownStock(state.seed, tile.coord);
  const entry = stock.find((candidate) => candidate.item.id === itemId);
  if (!entry) return message(state, 'That item is not available here.');

  const gold = getGoldAmount(state.player.inventory);
  if (gold < entry.price)
    return message(
      state,
      `You need ${entry.price} gold to buy ${entry.item.name}.`,
    );

  const next = clone(state);
  spendGold(next.player.inventory, entry.price);
  addItemToInventory(next.player.inventory, { ...entry.item });
  addLog(next, 'system', `You buy ${entry.item.name} for ${entry.price} gold.`);
  return next;
}

export function takeAllTileItems(state: GameState): GameState {
  const next = clone(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  if (tile.items.length === 0)
    return message(state, 'There is nothing here to take.');

  tile.items.forEach((item) => addItemToInventory(next.player.inventory, item));
  next.tiles[key] = normalizeStructureState({ ...tile, items: [] });
  addLog(
    next,
    'loot',
    `You take ${tile.items.map((item) => describeItemStack(item)).join(', ')}.`,
  );
  return next;
}

export function dropInventoryItem(state: GameState, itemId: string): GameState {
  const next = clone(state);
  const itemIndex = next.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, 'That item is not in your pack.');

  const [item] = next.player.inventory.splice(itemIndex, 1);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, item);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(next, 'loot', `You drop ${describeItemStack(item)}.`);
  return next;
}

export function dropEquippedItem(
  state: GameState,
  slot: EquipmentSlot,
): GameState {
  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, 'That slot is already empty.');

  const next = clone(state);
  delete next.player.equipment[slot];
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, equipped);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'loot', `You drop ${equipped.name}.`);
  return next;
}

export function craftRecipe(state: GameState, recipeId: string): GameState {
  if (state.gameOver) return state;

  const recipe = RECIPE_BOOK_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return message(state, 'That recipe is not in your book.');
  if (!hasRecipeBook(state.player.inventory)) {
    return message(state, 'You need a recipe book to follow that recipe.');
  }
  if (!state.player.learnedRecipeIds.includes(recipe.id)) {
    return message(state, 'You have not learned that recipe yet.');
  }
  const requiredStructure = recipe.skill === 'cooking' ? 'camp' : 'workshop';
  const requiredLabel = recipe.skill === 'cooking' ? 'campfire' : 'workshop';
  if (getCurrentTile(state).structure !== requiredStructure) {
    return message(
      state,
      `You need to stand on a ${requiredLabel} hex to ${recipe.skill === 'cooking' ? 'cook' : 'craft'}.`,
    );
  }
  if (!hasAllRequirements(state.player.inventory, recipe.ingredients)) {
    return message(
      state,
      `You lack the materials to make ${recipe.output.name}.`,
    );
  }

  const chosenFuel = recipe.fuelOptions
    ? pickSatisfiedRequirement(state.player.inventory, recipe.fuelOptions)
    : undefined;
  if (recipe.fuelOptions && !chosenFuel) {
    return message(
      state,
      'You need burnable fuel: sticks x8, logs x2, or coal x1.',
    );
  }

  const next = clone(state);
  consumeRequirements(next.player.inventory, recipe.ingredients);
  if (chosenFuel) consumeRequirements(next.player.inventory, [chosenFuel]);
  addItemToInventory(
    next.player.inventory,
    materializeRecipeOutput(recipe, next),
  );
  gainSkillXp(next, recipe.skill, recipe.output.tier);
  addLog(
    next,
    'system',
    recipe.skill === 'cooking'
      ? `You cook ${recipe.output.name}${chosenFuel ? ` with ${describeRequirement(chosenFuel)}` : ''}.`
      : `You craft ${recipe.output.name}.`,
  );
  return next;
}

function consumeItem(state: GameState, itemIndex: number, item: Item) {
  if (item.quantity > 1) {
    state.player.inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - 1,
    };
  } else {
    state.player.inventory.splice(itemIndex, 1);
  }

  const maxHp = getPlayerStats(state.player).maxHp;
  state.player.hp = Math.min(maxHp, state.player.hp + item.healing);
  state.player.hunger = Math.min(100, state.player.hunger + item.hunger);
  addLog(
    state,
    'survival',
    `You use ${item.name}${item.healing > 0 ? ` and recover ${item.healing} HP` : ''}${item.hunger > 0 ? ` and ${item.hunger} hunger` : ''}.`,
  );
}

function cacheSafeStart(state: GameState) {
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

function ensureTileState(state: GameState, coord: HexCoord) {
  const key = hexKey(coord);
  if (!state.tiles[key]) {
    const tile = buildTile(state.seed, coord);
    state.tiles[key] = tile;
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
      );
    }
  });
}

function buildTile(seed: string, coord: HexCoord): Tile {
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
  if (roll > 0.988) return makeResource(seed, coord, tier);
  if (roll > 0.94 || tier >= 7 || structure === 'dungeon')
    return makeArtifact(
      seed,
      coord,
      tier,
      structure === 'dungeon' ? 'rare' : undefined,
    );
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

function makeEnemy(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  index = 0,
  structure?: StructureType,
): Enemy {
  const tier = terrainTier(coord, terrain) + (structure === 'dungeon' ? 2 : 0);
  const roll = noise(`${seed}:enemy:type:${index}`, coord);
  const elite = structure === 'dungeon';
  const hp = 8 + tier * 6 + (elite ? 10 : 0);
  const attack = 2 + tier * 2 + (elite ? 3 : 0);
  const defense = 1 + tier + (elite ? 2 : 0);

  return {
    id: enemyKey(coord, index),
    name: pickEnemyName(terrain, roll, elite),
    coord,
    tier: elite ? tier + 1 : tier,
    maxHp: hp,
    hp,
    attack,
    defense,
    xp: 18 + tier * 14 + (elite ? 25 : 0),
    elite,
  };
}

function makeWeapon(
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

function makeOffhand(
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

function makeArmor(
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
    id: `${slot}-${name.toLowerCase().replace(/\s+/g, '-')}-${hexKey(coord)}`,
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

function makeArtifact(
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
    rarity: 'common',
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
    rarity: 'common',
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
    rarity: 'common',
    power: 0,
    defense,
    maxHp: tier,
    healing: 0,
    hunger: 0,
  };
}

function makeRecipeBook(): Item {
  return {
    id: 'recipe-book',
    kind: 'resource',
    name: RECIPE_BOOK_ITEM_NAME,
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
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
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing,
    hunger,
  };
}

function gainXp(state: GameState, amount: number) {
  state.player.xp += amount;
  while (state.player.level < MAX_PLAYER_LEVEL) {
    const requiredXp = levelThreshold(state.player.level);
    if (state.player.xp < requiredXp) return;
    state.player.xp -= requiredXp;
    state.player.level += 1;
    state.player.baseMaxHp += 6;
    state.player.baseMaxMana += 2;
    state.player.baseAttack += 1;
    state.player.baseDefense += 1;
    state.player.hp = getPlayerStats(state.player).maxHp;
    state.player.mana = state.player.baseMaxMana;
    addLog(state, 'system', `You reached level ${state.player.level}.`);
  }

  while (state.player.xp >= masteryLevelThreshold(state.player.masteryLevel)) {
    state.player.xp -= masteryLevelThreshold(state.player.masteryLevel);
    state.player.masteryLevel += 1;
    addLog(
      state,
      'system',
      `You reached mastery level ${state.player.masteryLevel}.`,
    );
  }
}

function gainSkillXp(state: GameState, skill: SkillName, amount: number) {
  const progress = state.player.skills[skill];
  progress.xp += amount;
  while (progress.xp >= skillLevelThreshold(progress.level)) {
    progress.xp -= skillLevelThreshold(progress.level);
    progress.level += 1;
    addLog(
      state,
      'system',
      `Your ${skill} skill reaches level ${progress.level}.`,
    );
  }
}

function rollGatheringBonus(state: GameState, skill: SkillName) {
  const chance = Math.min(1, state.player.skills[skill].level / 100);
  const rng = createRng(
    `${state.seed}:gather-bonus:${skill}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  return rng() < chance ? 1 : 0;
}

function respawnAtNearestTown(state: GameState, from: HexCoord) {
  const town = findNearestStructure(state.seed, from, 'town') ?? { q: 0, r: 0 };
  state.player.coord = town;
  state.player.hp = getPlayerStats(state.player).maxHp;
  state.player.mana = state.player.baseMaxMana;
  state.player.hunger = 100;
  state.combat = null;
  addLog(state, 'combat', 'You were defeated.');
  addLog(
    state,
    'system',
    `You awaken in the nearest town at ${town.q}, ${town.r}.`,
  );
}

function syncCombatEnemies(state: GameState) {
  if (!state.combat) return;
  const tile =
    state.tiles[hexKey(state.combat.coord)] ??
    buildTile(state.seed, state.combat.coord);
  const enemyIds = tile.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );
  state.tiles[hexKey(state.combat.coord)] = normalizeStructureState({
    ...tile,
    enemyIds,
  });
  state.combat.enemyIds = enemyIds;
  if (enemyIds.length === 0) {
    state.combat = null;
    addLog(state, 'combat', 'The battle is over.');
  }
}

function findNearestStructure(
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

const MAX_PLAYER_LEVEL = 100;

function levelThreshold(level: number) {
  return 40 + level * 25;
}

function masteryLevelThreshold(masteryLevel: number) {
  return levelThreshold(MAX_PLAYER_LEVEL + masteryLevel) * 20;
}

function terrainTier(coord: HexCoord, terrain: Terrain) {
  const distance = Math.floor(hexDistance(coord, { q: 0, r: 0 }) / 4);
  const terrainBonus = terrain === 'mountain' ? 2 : terrain === 'swamp' ? 1 : 0;
  return 1 + distance + terrainBonus;
}

function isPassable(terrain: Terrain) {
  return terrain !== 'water' && terrain !== 'mountain';
}

export function isGatheringStructure(
  structure?: StructureType,
): structure is GatheringStructureType {
  return (
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

function pickEquipmentRarity(
  seed: string,
  coord: HexCoord,
  tier: number,
  minimum: ItemRarity = 'common',
): ItemRarity {
  const roll = noise(`${seed}:rarity`, coord) + Math.min(0.06, tier * 0.0025);
  const rarity =
    roll > 0.995
      ? 'legendary'
      : roll > 0.945
        ? 'epic'
        : roll > 0.745
          ? 'rare'
          : roll > 0.145
            ? 'uncommon'
            : 'common';
  return (
    RARITY_ORDER[
      Math.max(RARITY_ORDER.indexOf(minimum), RARITY_ORDER.indexOf(rarity))
    ] ?? minimum
  );
}

function applyRarityToItem(item: Item): Item {
  const multiplier = rarityMultiplier(item.rarity);
  return {
    ...item,
    power: Math.round(item.power * multiplier),
    defense: Math.round(item.defense * multiplier),
    maxHp: Math.round(item.maxHp * multiplier + rarityBonus(item.rarity)),
  };
}

function rarityMultiplier(rarity: ItemRarity) {
  switch (rarity) {
    case 'uncommon':
      return 1.2;
    case 'rare':
      return 1.45;
    case 'epic':
      return 1.8;
    case 'legendary':
      return 2.2;
    default:
      return 1;
  }
}

function rarityBonus(rarity: ItemRarity) {
  switch (rarity) {
    case 'rare':
      return 1;
    case 'epic':
      return 2;
    case 'legendary':
      return 4;
    default:
      return 0;
  }
}

function message(state: GameState, text: string): GameState {
  const next = clone(state);
  addLog(next, 'system', text);
  return next;
}

function enemyKey(coord: HexCoord, index: number) {
  return `enemy-${hexKey(coord)}-${index}`;
}

function enemyIndexFromId(enemyId: string) {
  const parts = enemyId.split('-');
  return Number(parts[parts.length - 1] ?? '0') || 0;
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
    combat: state.combat
      ? {
          ...state.combat,
          coord: { ...state.combat.coord },
          enemyIds: [...state.combat.enemyIds],
        }
      : null,
    tiles: Object.fromEntries(
      Object.entries(state.tiles).map(([key, tile]) => [
        key,
        {
          ...tile,
          coord: { ...tile.coord },
          items: tile.items.map((item) => ({ ...item })),
          enemyIds: [...tile.enemyIds],
        },
      ]),
    ),
    enemies: Object.fromEntries(
      Object.entries(state.enemies).map(([key, enemy]) => [
        key,
        { ...enemy, coord: { ...enemy.coord } },
      ]),
    ),
    player: {
      ...state.player,
      coord: { ...state.player.coord },
      skills: Object.fromEntries(
        Object.entries(state.player.skills).map(([key, value]) => [
          key,
          { ...value },
        ]),
      ) as Record<SkillName, SkillProgress>,
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
  consolidateStackInto(inventory, item);
}

function compareItems(left: Item, right: Item) {
  const kindOrder = ['resource', 'consumable', 'artifact', 'armor', 'weapon'];
  const kindDelta =
    kindOrder.indexOf(left.kind) - kindOrder.indexOf(right.kind);
  if (kindDelta !== 0) return kindDelta;
  const rarityDelta =
    RARITY_ORDER.indexOf(right.rarity) - RARITY_ORDER.indexOf(left.rarity);
  if (rarityDelta !== 0) return rarityDelta;
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
  return Math.round(
    (base + item.tier * 2 + RARITY_ORDER.indexOf(item.rarity) * 6) *
      item.quantity,
  );
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
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function maybeDropEnemyGold(state: GameState, enemy: Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
  const chance = enemy.elite ? 0.85 : Math.min(0.7, 0.22 + enemy.tier * 0.06);
  if (rng() > chance) return;

  const quantity = Math.max(
    1,
    Math.floor(enemy.tier + rng() * (enemy.elite ? 10 : 5)),
  );
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeGoldStack(quantity));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(state, 'loot', `${enemy.name} dropped ${quantity} gold.`);
}

function maybeDropEnemyRecipe(state: GameState, enemy: Enemy) {
  const unlearnedRecipes = RECIPE_BOOK_RECIPES.filter(
    (recipe) => !state.player.learnedRecipeIds.includes(recipe.id),
  );
  if (unlearnedRecipes.length === 0) return;

  const rng = createRng(`${state.seed}:enemy-recipe:${enemy.id}:${state.turn}`);
  const chance = enemy.elite ? 0.45 : Math.min(0.3, 0.08 + enemy.tier * 0.025);
  if (rng() >= chance) return;

  const recipe = unlearnedRecipes[Math.floor(rng() * unlearnedRecipes.length)];
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeRecipePage(recipe));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(state, 'loot', `${enemy.name} dropped Recipe: ${recipe.name}.`);
}

function maybeSkinEnemy(state: GameState, enemy: Enemy) {
  if (!isAnimalEnemy(enemy.name)) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const quantity = Math.max(1, Math.ceil(enemy.tier / 2));
  addItemToInventory(
    tile.items,
    makeResourceStack('Leather Scraps', enemy.tier, quantity),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  gainSkillXp(state, 'skinning', quantity);
  addLog(
    state,
    'loot',
    `You skin the ${enemy.name} for ${quantity} Leather Scraps.`,
  );
}

export function makeGoldStack(quantity: number): Item {
  return {
    id: 'resource-gold-1',
    kind: 'resource',
    name: 'Gold',
    quantity,
    tier: 1,
    rarity: 'common',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
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

export function canEquipItem(item: Item) {
  return isEquippableItem(item);
}

export function canUseItem(item: Item) {
  return item.kind === 'consumable' || isRecipeBook(item) || isRecipePage(item);
}

export function isRecipeBook(item: Item) {
  return item.kind === 'resource' && item.name === RECIPE_BOOK_ITEM_NAME;
}

export function isRecipePage(item: Item) {
  return item.kind === 'resource' && Boolean(item.recipeId);
}

export function hasRecipeBook(inventory: Item[]) {
  return inventory.some(isRecipeBook);
}

export function getGoldAmount(inventory: Item[]) {
  return inventory.reduce(
    (sum, item) =>
      item.kind === 'resource' && item.name === 'Gold'
        ? sum + item.quantity
        : sum,
    0,
  );
}

function makeStartingSkills(): Record<SkillName, SkillProgress> {
  return {
    logging: { level: 1, xp: 0 },
    mining: { level: 1, xp: 0 },
    skinning: { level: 1, xp: 0 },
    fishing: { level: 1, xp: 0 },
    cooking: { level: 1, xp: 0 },
    crafting: { level: 1, xp: 0 },
  };
}

function makeStructureState(structure: StructureType) {
  if (!isGatheringStructure(structure)) return undefined;
  const maxHp = structureDefinition(structure).maxHp;
  return { hp: maxHp, maxHp };
}

function buildTownStock(seed: string, coord: HexCoord): TownStockEntry[] {
  const ration = makeConsumable(
    `town-ration-${hexKey(coord)}`,
    'Trail Ration',
    1,
    8,
    12,
    2,
  );
  const jerky = makeConsumable(
    `town-jerky-${hexKey(coord)}`,
    'Jerky Pack',
    2,
    6,
    20,
  );
  const hood = applyRarityToItem({
    ...makeStarterArmor('head', 'Scout Hood', 1, 1),
    id: `town-hood-${hexKey(coord)}`,
    rarity: noise(`${seed}:town-stock`, coord) > 0.6 ? 'uncommon' : 'common',
  });
  const knife = {
    ...makeStarterWeapon(),
    id: `town-knife-${hexKey(coord)}`,
    name: 'Town Knife',
  };

  return [
    { item: ration, price: 6 },
    { item: jerky, price: 10 },
    { item: hood, price: 18 + RARITY_ORDER.indexOf(hood.rarity) * 6 },
    { item: knife, price: 16 },
  ];
}

function normalizeStructureState(tile: Tile): Tile {
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

function structureDefinition(structure: GatheringStructureType) {
  switch (structure) {
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

function structureLabel(structure: GatheringStructureType) {
  switch (structure) {
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

function skillLevelThreshold(level: number) {
  return 5 + level * 3;
}

function pickEnemyName(terrain: Terrain, roll: number, elite: boolean) {
  if (elite) return roll > 0.5 ? 'Marauder' : 'Raider';
  if (terrain === 'forest')
    return roll > 0.66 ? 'Wolf' : roll > 0.33 ? 'Boar' : 'Raider';
  if (terrain === 'plains')
    return roll > 0.66 ? 'Stag' : roll > 0.33 ? 'Boar' : 'Marauder';
  if (terrain === 'swamp') return roll > 0.5 ? 'Boar' : 'Wolf';
  return roll > 0.5 ? 'Raider' : 'Marauder';
}

function isAnimalEnemy(name: string) {
  return name === 'Wolf' || name === 'Boar' || name === 'Stag';
}

function spendGold(inventory: Item[], amount: number) {
  let remaining = amount;
  for (
    let index = inventory.length - 1;
    index >= 0 && remaining > 0;
    index -= 1
  ) {
    const item = inventory[index];
    if (item.kind !== 'resource' || item.name !== 'Gold') continue;
    const spent = Math.min(item.quantity, remaining);
    item.quantity -= spent;
    remaining -= spent;
    if (item.quantity <= 0) inventory.splice(index, 1);
  }
}

function isSameStackable(left: Item, right: Item) {
  return (
    (left.kind === 'consumable' || left.kind === 'resource') &&
    left.kind === right.kind &&
    left.recipeId === right.recipeId &&
    left.name === right.name &&
    left.rarity === right.rarity &&
    left.healing === right.healing &&
    left.hunger === right.hunger
  );
}

function hasAllRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.every((requirement) =>
    inventory.some(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
    ),
  );
}

function pickSatisfiedRequirement(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  return requirements.find((requirement) =>
    inventory.some(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
    ),
  );
}

function consumeRequirements(
  inventory: Item[],
  requirements: RecipeRequirement[],
) {
  requirements.forEach((requirement) => {
    const itemIndex = inventory.findIndex(
      (item) =>
        item.name === requirement.name && item.quantity >= requirement.quantity,
    );
    if (itemIndex < 0) return;
    const item = inventory[itemIndex];
    if (item.quantity === requirement.quantity) {
      inventory.splice(itemIndex, 1);
      return;
    }
    inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - requirement.quantity,
    };
  });
}

function consumeInventoryItem(
  inventory: Item[],
  itemIndex: number,
  item: Item,
) {
  if (item.quantity > 1) {
    inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - 1,
    };
    return;
  }

  inventory.splice(itemIndex, 1);
}

function learnRecipe(state: GameState, item: Item) {
  if (!item.recipeId) return;

  const recipe = RECIPE_BOOK_RECIPES.find(
    (entry) => entry.id === item.recipeId,
  );
  if (!recipe) return;
  if (state.player.learnedRecipeIds.includes(recipe.id)) {
    addLog(state, 'system', `You already know how to make ${recipe.name}.`);
    return;
  }

  state.player.learnedRecipeIds.push(recipe.id);
  state.player.learnedRecipeIds.sort();
  addLog(state, 'system', `You learn the ${recipe.name} recipe.`);
}

function describeRequirement(requirement: RecipeRequirement) {
  return `${requirement.quantity} ${requirement.name}`;
}

function makeCraftedItem(
  id: string,
  kind: Exclude<ItemKind, 'consumable' | 'resource'>,
  slot: EquipmentSlot,
  name: string,
  stats: Pick<Item, 'power' | 'defense' | 'maxHp'>,
): Item {
  return {
    id,
    kind,
    slot,
    name,
    quantity: 1,
    tier: 1,
    rarity: 'common',
    power: stats.power,
    defense: stats.defense,
    maxHp: stats.maxHp,
    healing: 0,
    hunger: 0,
  };
}

function makeCookedFish(): Item {
  return makeConsumable('cooked-fish', COOKED_FISH_ITEM_NAME, 1, 4, 24);
}

function makeRecipePage(recipe: RecipeDefinition): Item {
  return {
    id: `recipe-${recipe.id}`,
    recipeId: recipe.id,
    kind: 'resource',
    name: `Recipe: ${recipe.name}`,
    quantity: 1,
    tier: recipe.output.tier,
    rarity: 'uncommon',
    power: 0,
    defense: 0,
    maxHp: 0,
    healing: 0,
    hunger: 0,
  };
}

function materializeRecipeOutput(
  recipe: RecipeDefinition,
  state: GameState,
): Item {
  if (
    recipe.output.kind === 'consumable' ||
    recipe.output.kind === 'resource'
  ) {
    return { ...recipe.output };
  }

  return {
    ...recipe.output,
    id: `${recipe.output.id}-${state.turn}-${state.logSequence}`,
  };
}

function describeItemStack(item: Item) {
  return item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name;
}

function consolidateInventory(inventory: Item[]) {
  return inventory.reduce<Item[]>((merged, item) => {
    consolidateStackInto(merged, item);
    return merged;
  }, []);
}

function consolidateStackInto(inventory: Item[], item: Item) {
  if (item.kind !== 'consumable' && item.kind !== 'resource') {
    inventory.push(item);
    return;
  }

  const existing = inventory.find((entry) => isSameStackable(entry, item));
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  inventory.push(item);
}

const RECIPE_BOOK_RECIPES: RecipeDefinition[] = [
  {
    id: 'cook-cooked-fish',
    name: 'Cooked Fish',
    description: 'Cook raw fish over a small fire.',
    skill: 'cooking',
    output: makeCookedFish(),
    ingredients: [{ name: 'Raw Fish', quantity: 1 }],
    fuelOptions: [
      { name: 'Coal', quantity: 1 },
      { name: 'Logs', quantity: 2 },
      { name: 'Sticks', quantity: 8 },
    ],
  },
  {
    id: 'craft-weapon',
    name: 'Camp Spear',
    description: 'A basic weapon for the weapon slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-weapon',
      'weapon',
      'weapon',
      'Camp Spear',
      {
        power: 3,
        defense: 0,
        maxHp: 0,
      },
    ),
    ingredients: [
      { name: 'Iron Chunks', quantity: 2 },
      { name: 'Sticks', quantity: 2 },
    ],
  },
  {
    id: 'craft-offhand',
    name: 'Hide Buckler',
    description: 'A basic offhand for the offhand slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-offhand',
      'armor',
      'offhand',
      'Hide Buckler',
      {
        power: 0,
        defense: 2,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Logs', quantity: 1 },
    ],
  },
  {
    id: 'craft-head',
    name: 'Patchwork Hood',
    description: 'A basic helm for the head slot.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-head', 'armor', 'head', 'Patchwork Hood', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 2 },
      { name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-chest',
    name: 'Settler Vest',
    description: 'A basic chest piece for the chest slot.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-chest', 'armor', 'chest', 'Settler Vest', {
      power: 0,
      defense: 2,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 4 },
      { name: 'Leather Scraps', quantity: 4 },
      { name: 'Iron Chunks', quantity: 1 },
    ],
  },
  {
    id: 'craft-hands',
    name: 'Work Gloves',
    description: 'A basic hand piece for the hands slot.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-hands', 'armor', 'hands', 'Work Gloves', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Cloth', quantity: 1 },
    ],
  },
  {
    id: 'craft-legs',
    name: 'Trail Leggings',
    description: 'A basic leg piece for the legs slot.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-legs', 'armor', 'legs', 'Trail Leggings', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Cloth', quantity: 3 },
      { name: 'Leather Scraps', quantity: 2 },
    ],
  },
  {
    id: 'craft-feet',
    name: 'Field Boots',
    description: 'A basic boot piece for the feet slot.',
    skill: 'crafting',
    output: makeCraftedItem('crafted-feet', 'armor', 'feet', 'Field Boots', {
      power: 0,
      defense: 1,
      maxHp: 1,
    }),
    ingredients: [
      { name: 'Leather Scraps', quantity: 3 },
      { name: 'Sticks', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-left',
    name: 'Copper Loop',
    description: 'A basic ring for the left ring slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-ring-left',
      'artifact',
      'ringLeft',
      'Copper Loop',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Copper Ore', quantity: 2 },
      { name: 'Arcane Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-ring-right',
    name: 'Copper Band',
    description: 'A basic ring for the right ring slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-ring-right',
      'artifact',
      'ringRight',
      'Copper Band',
      {
        power: 1,
        defense: 0,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Copper Ore', quantity: 2 },
      { name: 'Arcane Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-amulet',
    name: 'Charm Necklace',
    description: 'A basic amulet for the amulet slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-amulet',
      'artifact',
      'amulet',
      'Charm Necklace',
      {
        power: 0,
        defense: 1,
        maxHp: 2,
      },
    ),
    ingredients: [
      { name: 'Iron Chunks', quantity: 1 },
      { name: 'Arcane Dust', quantity: 2 },
    ],
  },
  {
    id: 'craft-cloak',
    name: 'Wayfarer Cloak',
    description: 'A basic cloak for the cloak slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-cloak',
      'artifact',
      'cloak',
      'Wayfarer Cloak',
      {
        power: 0,
        defense: 1,
        maxHp: 1,
      },
    ),
    ingredients: [
      { name: 'Cloth', quantity: 3 },
      { name: 'Arcane Dust', quantity: 1 },
    ],
  },
  {
    id: 'craft-relic',
    name: 'Hearth Totem',
    description: 'A basic relic for the relic slot.',
    skill: 'crafting',
    output: makeCraftedItem(
      'crafted-relic',
      'artifact',
      'relic',
      'Hearth Totem',
      {
        power: 1,
        defense: 0,
        maxHp: 3,
      },
    ),
    ingredients: [
      { name: 'Coal', quantity: 1 },
      { name: 'Arcane Dust', quantity: 3 },
      { name: 'Logs', quantity: 1 },
    ],
  },
];

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
  ].slice(0, 100);
}

function makeLog(
  sequence: number,
  kind: LogKind,
  turn: number,
  text: string,
): LogEntry {
  return { id: `l-${sequence}`, kind, text, turn };
}

function rumorForSeed(seed: string) {
  const rumors = [
    'Rumor: dungeon vaults hide the finest relics, but their guardians do not fight alone.',
    'Rumor: every forge can tease hidden materials from gear if your hands are patient enough.',
    'Rumor: merchants only trust business done inside town walls.',
    'Rumor: the farther you walk, the sharper the steel and the harsher the teeth.',
    'Rumor: tree lines near the center regrow slowly, so greedy chopping leaves long hungry roads.',
    'Rumor: shallow ponds feed the patient, but lakes hide deeper rewards and deeper trouble.',
    'Rumor: coal veins tend to sit where the land already looks half-burned and bitter.',
    'Rumor: the best armor comes from surviving one more trip than you thought you could.',
    'Rumor: some ruins look empty until the first step wakes everything inside.',
    'Rumor: a full pack is safer than a sharp blade right up until the fighting starts.',
    'Rumor: iron pays for persistence, copper pays for speed, and both punish dull tools.',
    'Rumor: hunger kills more heroes than wolves ever will.',
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
