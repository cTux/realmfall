import { hexDistance, hexKey, type HexCoord } from './hex';
import {
  BLOOD_MOON_CHANCE,
  BLOOD_MOON_SPAWN_RADIUS,
  STARTING_RECIPE_IDS,
  WORLD_RADIUS,
} from './config';
import { createRng } from './random';
import {
  enemyIndexFromId,
  isAnimalEnemy,
  makeEnemy,
  nextEnemySpawnIndex,
  syncEnemyBloodMoonState,
} from './combat';
import {
  consumeRequirements,
  describeRequirement,
  getRecipeBookRecipes as getRecipeBookRecipesFromDefinitions,
  hasAllRequirements,
  learnRecipe,
  pickSatisfiedRequirement,
  RECIPE_BOOK_RECIPES,
} from './crafting';
import { buildTownStock } from './economy';
import {
  addLog,
  createFreshLogs,
  getDayPhase,
  isBloodMoonRiseWindow,
  normalizeWorldMinutes,
  worldTimeMsFromMinutes,
} from './logs';
import {
  addItemToInventory,
  canEquipItem,
  canUseItem,
  compareItems,
  consolidateInventory,
  consumeInventoryItem,
  describeItemStack,
  getGoldAmount,
  hasRecipeBook,
  isEquippableItem,
  isRecipeBook,
  isRecipePage,
  makeConsumable,
  makeGoldStack,
  makeRecipeBook,
  makeRecipePage,
  makeResourceStack,
  makeStarterArmor,
  makeStarterWeapon,
  materializeRecipeOutput,
  prospectYield,
  sellValue,
  spendGold,
} from './inventory';
import {
  gainSkillXp,
  gainXp,
  getPlayerStats,
  makeStartingSkills,
  rollGatheringBonus,
} from './progression';
import { isPassable, noise } from './shared';
import {
  buildTile,
  cacheSafeStart,
  describeStructure,
  ensureTileState,
  findNearestStructure,
  isGatheringStructure,
  makeArmor,
  makeArtifact,
  makeOffhand,
  makeWeapon,
  normalizeStructureState,
  structureActionLabel,
  structureDefinition,
} from './world';

export { hexAtPoint, hexDistance } from './hex';
export type { HexCoord } from './hex';
export type {
  CombatState,
  Enemy,
  Equipment,
  EquipmentSlot,
  GameState,
  GatheringStructureType,
  Item,
  ItemKind,
  ItemRarity,
  LogEntry,
  LogKind,
  Player,
  RecipeDefinition,
  RecipeRequirement,
  SkillName,
  SkillProgress,
  StructureType,
  Terrain,
  Tile,
  TownStockEntry,
} from './types';
export { EQUIPMENT_SLOTS, RARITY_ORDER } from './types';
export {
  canEquipItem,
  canUseItem,
  createFreshLogs,
  describeStructure,
  getGoldAmount,
  getPlayerStats,
  hasRecipeBook,
  isGatheringStructure,
  isRecipeBook,
  isRecipePage,
  makeGoldStack,
  structureActionLabel,
};

import type {
  EquipmentSlot,
  GameState,
  Item,
  Player,
  TownStockEntry,
  StructureType,
  Terrain,
} from './types';

export function createGame(
  radius = WORLD_RADIUS,
  seed = `world-${Date.now()}`,
): GameState {
  const state: GameState = {
    seed,
    radius,
    turn: 0,
    worldTimeMs: 0,
    dayPhase: 'night',
    bloodMoonActive: false,
    bloodMoonCheckedTonight: false,
    bloodMoonCycle: 0,
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

export function getRecipeBookRecipes(learnedRecipeIds?: string[]) {
  return getRecipeBookRecipesFromDefinitions(
    RECIPE_BOOK_RECIPES,
    learnedRecipeIds,
  );
}

export function getVisibleTiles(state: GameState) {
  const tiles = [];
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
          state.bloodMoonActive,
        ),
    )
    .filter(Boolean);
}

export function getEnemyAt(state: GameState, coord: HexCoord) {
  return getEnemiesAt(state, coord)[0];
}

export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;
  if (state.combat) return message(state, 'Finish the current battle first.');

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

export function syncBloodMoon(
  state: GameState,
  worldTimeMinutes: number,
): GameState {
  const minutes = normalizeWorldMinutes(worldTimeMinutes);
  const phase = getDayPhase(minutes);

  if (state.dayPhase !== phase) {
    const next = clone(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    next.dayPhase = phase;
    addLog(
      next,
      'system',
      phase === 'night'
        ? 'Night falls across the wilds.'
        : 'Morning breaks over the wilds.',
    );
    return syncBloodMoon(next, minutes);
  }

  if (isBloodMoonRiseWindow(minutes)) {
    if (state.bloodMoonCheckedTonight) return state;

    const next = clone(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    next.bloodMoonCheckedTonight = true;

    const rng = createRng(`${state.seed}:blood-moon:${state.bloodMoonCycle}`);
    if (rng() >= BLOOD_MOON_CHANCE) return next;

    next.bloodMoonActive = true;
    syncEnemyBloodMoonState(next.enemies, true);
    const spawnedCount = spawnBloodMoonEnemies(next);
    addLog(next, 'combat', 'Blood moon begins. A red hunger sweeps the wilds.');
    if (spawnedCount > 0) {
      addLog(
        next,
        'combat',
        `Blood moon horrors gather nearby (${spawnedCount} foe${spawnedCount === 1 ? '' : 's'}).`,
      );
    }
    return next;
  }

  if (
    phase === 'day' &&
    (state.bloodMoonActive || state.bloodMoonCheckedTonight)
  ) {
    const next = clone(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    const wasBloodMoonActive = next.bloodMoonActive;
    next.bloodMoonActive = false;
    next.bloodMoonCheckedTonight = false;
    next.bloodMoonCycle += 1;
    syncEnemyBloodMoonState(next.enemies, false);
    if (wasBloodMoonActive) {
      addLog(next, 'combat', 'Blood moon ends. The night loosens its grip.');
    }
    return next;
  }

  return state;
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
    gainXp(next, enemy.xp, addLog);
    maybeDropEnemyGold(next, enemy);
    maybeDropEnemyRecipe(next, enemy);
    maybeDropBloodMoonLoot(next, enemy);
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
    learnRecipe(next, item, RECIPE_BOOK_RECIPES, addLog);
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
  if (getCurrentTile(state).structure !== 'town') {
    return message(state, 'You can sell only while standing in town.');
  }
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
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, 'You can prospect only while standing at a forge.');
  }

  const next = clone(state);
  const prospectable = next.player.inventory.filter(isEquippableItem);
  if (prospectable.length === 0) {
    return message(state, 'Nothing in your pack can be prospected.');
  }

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
  if (!isGatheringStructure(tile.structure)) {
    return message(state, 'There is nothing here to gather.');
  }

  const next = clone(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const currentTile = next.tiles[key];
  if (!isGatheringStructure(currentTile.structure)) {
    return message(state, 'There is nothing here to gather.');
  }

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
  const reward = makeResourceStack(
    definition.reward,
    definition.rewardTier,
    quantity,
  );
  addItemToInventory(next.player.inventory, reward);
  gainSkillXp(next, definition.skill, damage, addLog);

  addLog(
    next,
    'loot',
    `${definition.verb} and bring in ${describeItemStack(reward)}.`,
  );
  if (bonusLoot > 0) {
    addLog(
      next,
      'system',
      `Your ${definition.skill} skill nets extra ${definition.reward.toLowerCase()}.`,
    );
  }

  if (currentTile.structureHp <= 0) {
    addLog(next, 'system', definition.depletedText);
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
  if (tile.structure !== 'town') {
    return message(state, 'You can buy only while standing in town.');
  }

  const stock = buildTownStock(state.seed, tile.coord);
  const entry = stock.find((candidate) => candidate.item.id === itemId);
  if (!entry) return message(state, 'That item is not available here.');

  const gold = getGoldAmount(state.player.inventory);
  if (gold < entry.price) {
    return message(
      state,
      `You need ${entry.price} gold to buy ${entry.item.name}.`,
    );
  }

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
  gainSkillXp(next, recipe.skill, recipe.output.tier, addLog);
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
  consumeInventoryItem(state.player.inventory, itemIndex, item);
  const maxHp = getPlayerStats(state.player).maxHp;
  state.player.hp = Math.min(maxHp, state.player.hp + item.healing);
  state.player.hunger = Math.min(100, state.player.hunger + item.hunger);
  addLog(
    state,
    'survival',
    `You use ${item.name}${item.healing > 0 ? ` and recover ${item.healing} HP` : ''}${item.hunger > 0 ? ` and ${item.hunger} hunger` : ''}.`,
  );
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

function message(state: GameState, text: string): GameState {
  const next = clone(state);
  addLog(next, 'system', text);
  return next;
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
      ) as Player['skills'],
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

function maybeDropEnemyGold(state: GameState, enemy: import('./types').Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
  const chance = state.bloodMoonActive
    ? 1
    : enemy.elite
      ? 0.85
      : Math.min(0.7, 0.22 + enemy.tier * 0.06);
  if (rng() > chance) return;

  const quantity = Math.max(
    1,
    Math.floor(enemy.tier + rng() * (enemy.elite ? 10 : 5)),
  );
  const bloodMoonQuantity = state.bloodMoonActive
    ? Math.max(quantity + enemy.tier, Math.ceil(quantity * 2.5))
    : quantity;
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeGoldStack(bloodMoonQuantity));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(state, 'loot', `${enemy.name} dropped ${bloodMoonQuantity} gold.`);
}

function maybeDropEnemyRecipe(
  state: GameState,
  enemy: import('./types').Enemy,
) {
  const unlearnedRecipes = RECIPE_BOOK_RECIPES.filter(
    (recipe) => !state.player.learnedRecipeIds.includes(recipe.id),
  );
  if (unlearnedRecipes.length === 0) return;

  const rng = createRng(`${state.seed}:enemy-recipe:${enemy.id}:${state.turn}`);
  const chance = state.bloodMoonActive
    ? Math.min(
        1,
        (enemy.elite ? 0.45 : Math.min(0.3, 0.08 + enemy.tier * 0.025)) + 0.25,
      )
    : enemy.elite
      ? 0.45
      : Math.min(0.3, 0.08 + enemy.tier * 0.025);
  if (rng() >= chance) return;

  const recipe = unlearnedRecipes[Math.floor(rng() * unlearnedRecipes.length)];
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeRecipePage(recipe));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(state, 'loot', `${enemy.name} dropped Recipe: ${recipe.name}.`);
}

function maybeDropBloodMoonLoot(
  state: GameState,
  enemy: import('./types').Enemy,
) {
  if (!state.bloodMoonActive) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const baseTier = Math.max(1, enemy.tier + (enemy.elite ? 1 : 0));
  const minimumRarity = enemy.elite ? 'epic' : 'rare';
  addItemToInventory(
    tile.items,
    makeBloodMoonDrop(state, enemy, 0, baseTier, minimumRarity),
  );

  const rng = createRng(
    `${state.seed}:blood-moon-loot:${enemy.id}:${state.turn}`,
  );
  if (enemy.elite || rng() < 0.45) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(state, enemy, 1, baseTier + 1, minimumRarity),
    );
  }

  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(state, 'loot', `${enemy.name} left blood moon spoils behind.`);
}

function maybeSkinEnemy(state: GameState, enemy: import('./types').Enemy) {
  if (!isAnimalEnemy(enemy.name)) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const quantity = Math.max(
    1,
    Math.ceil(enemy.tier / 2) + (state.bloodMoonActive ? 1 : 0),
  );
  addItemToInventory(
    tile.items,
    makeResourceStack('Leather Scraps', enemy.tier, quantity),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  gainSkillXp(state, 'skinning', quantity, addLog);
  addLog(
    state,
    'loot',
    `You skin the ${enemy.name} for ${quantity} Leather Scraps.`,
  );
}

function spawnBloodMoonEnemies(state: GameState) {
  let spawned = 0;
  const maxEnemiesPerTile = 3;

  for (
    let dq = -BLOOD_MOON_SPAWN_RADIUS;
    dq <= BLOOD_MOON_SPAWN_RADIUS;
    dq += 1
  ) {
    for (
      let dr = -BLOOD_MOON_SPAWN_RADIUS;
      dr <= BLOOD_MOON_SPAWN_RADIUS;
      dr += 1
    ) {
      const coord = {
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > BLOOD_MOON_SPAWN_RADIUS) continue;

      ensureTileState(state, coord);
      const key = hexKey(coord);
      const tile = state.tiles[key];
      if (!canSpawnBloodMoonEnemiesOnTile(tile.terrain, tile.structure))
        continue;

      const rng = createRng(
        `${state.seed}:blood-moon-spawn:${state.bloodMoonCycle}:${key}`,
      );
      const spawnChance = distance <= 2 ? 0.82 : distance <= 4 ? 0.58 : 0.36;
      if (rng() >= spawnChance) continue;

      const availableSlots = Math.max(
        0,
        maxEnemiesPerTile - tile.enemyIds.length,
      );
      if (availableSlots === 0) continue;

      const count = Math.min(
        availableSlots,
        1 + Math.floor(rng() * (distance <= 2 ? 3 : 2)),
      );
      let nextIndex = nextEnemySpawnIndex(tile.enemyIds);
      for (let index = 0; index < count; index += 1) {
        const enemy = makeEnemy(
          state.seed,
          coord,
          tile.terrain,
          nextIndex,
          tile.structure,
          true,
        );
        tile.enemyIds.push(enemy.id);
        state.enemies[enemy.id] = enemy;
        nextIndex += 1;
        spawned += 1;
      }

      state.tiles[key] = { ...tile, enemyIds: [...tile.enemyIds] };
    }
  }

  return spawned;
}

function canSpawnBloodMoonEnemiesOnTile(
  terrain: Terrain,
  structure?: StructureType,
) {
  if (!isPassable(terrain)) return false;
  if (structure && structure !== 'dungeon') return false;
  return true;
}

function makeBloodMoonDrop(
  state: GameState,
  enemy: import('./types').Enemy,
  index: number,
  tier: number,
  minimumRarity: 'rare' | 'epic',
) {
  const coord = enemy.coord;
  const seed = `${state.seed}:blood-moon-drop:${enemy.id}:${state.turn}:${index}`;
  const roll = noise(`${seed}:roll`, coord);
  if (roll > 0.8) return makeArtifact(seed, coord, tier, minimumRarity);
  if (roll > 0.5) return makeWeapon(seed, coord, tier, minimumRarity);
  if (roll > 0.25) return makeOffhand(seed, coord, tier, minimumRarity);
  return makeArmor(seed, coord, tier, minimumRarity);
}
