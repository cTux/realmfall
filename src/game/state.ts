import { hexDistance, hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import { formatEquipmentSlotLabel } from '../i18n/labels';
import { Skill } from './types';
import {
  BLOOD_MOON_CHANCE,
  HARVEST_MOON_CHANCE,
  HARVEST_MOON_RESOURCE_CHANCES,
  STARTING_RECIPE_IDS,
  WORLD_RADIUS,
} from './config';
import { createRng } from './random';
import { getEnemyConfig, isAnimalEnemyType } from './content/enemies';
import {
  getItemConfig,
  getItemConfigByKey,
  hasItemTag,
  itemOccupiesOffhand,
} from './content/items';
import { EquipmentSlotId, ItemId } from './content/ids';
import { getStructureConfig } from './content/structures';
import { enemyRarityIndex, syncEnemyBloodMoonState } from './combat';
import { learnRecipe, RECIPE_BOOK_RECIPES } from './crafting';
import {
  addLog,
  createFreshLogsAtTime,
  getDayPhase,
  getWorldDayIndex,
  isBloodMoonRiseWindow,
  normalizeWorldMinutes,
  worldTimeMsFromMinutes,
} from './logs';
import {
  addItemToInventory,
  canEquipItem,
  canUseItem,
  consumeInventoryItem,
  getGoldAmount,
  isEquippableItem,
  isRecipePage,
  makeConsumable,
  makeGoldStack,
  makeStarterArmor,
  makeStarterWeapon,
} from './inventory';
import { getPlayerBaseStatsForLevel } from './balance';
import { GAME_TAGS } from './content/tags';
import {
  getConsumableRestoreProfile,
  resolvePercentRestoreAmount,
} from './consumables';
import {
  gatheringBonusChance,
  gatheringYieldBonus,
  getPlayerStats,
  makeStartingSkills,
  skillLevelThreshold,
} from './progression';
import { isPassable } from './shared';
import {
  cacheSafeStart,
  describeStructure,
  ensureTileState,
  isGatheringStructure,
  structureActionLabel,
} from './world';
import { copyGameState } from './stateClone';
import {
  cloneForPlayerCombatMutation,
  cloneForPlayerMutation,
  cloneForWorldEventMutation,
  cloneForWorldMutation,
  message,
} from './stateMutationHelpers';
import {
  buyTownItem,
  dropEquippedItem,
  dropInventoryItem,
  getTownStock,
  hasEquippableInventoryItems,
  isOffhandSlotDisabled,
  prospectInventory,
  prospectInventoryItem,
  sellAllItems,
  sellInventoryItem,
  setInventoryItemLocked,
  sortInventory,
  takeAllTileItems,
  takeTileItem,
} from './stateInventoryActions';
import {
  getCurrentTile,
  getEnemiesAt,
  getEnemyAt,
  getHostileEnemyIds,
  getPlayerClaimedTiles,
  getTileAt,
  getVisibleTiles,
} from './stateWorldQueries';
import { getSafePathToTile } from './statePathfinding';
import {
  applySurvivalDecay,
  processPlayerStatusEffects,
  respawnAtNearestTown,
  teleportHome,
} from './stateSurvival';
import { createCombatState } from './stateCombat';
import {
  maybeTriggerEarthshake,
  openEarthshakeDungeon,
  spawnBloodMoonEnemies,
  spawnHarvestMoonResources,
} from './stateWorldEvents';
import {
  claimCurrentHex,
  interactWithStructure,
  setHomeHex,
} from './stateWorldActions';
import {
  craftRecipe,
  getRecipeBookEntries,
  getRecipeBookRecipes,
} from './stateCrafting';

export { hexAtPoint, hexDistance } from './hex';
export type { HexCoord } from './hex';
export type {
  AbilityDefinition,
  AbilityId,
  CombatActorState,
  CombatCastState,
  CombatState,
  Enemy,
  Equipment,
  EquipmentSlot,
  GameState,
  GatheringStructureType,
  Item,
  ItemRarity,
  LogEntry,
  LogKind,
  LogRichSegment,
  Player,
  PlayerStatusEffect,
  RecipeBookEntry,
  RecipeDefinition,
  RecipeRequirement,
  SkillName,
  SkillProgress,
  StatusEffectId,
  StructureType,
  Terrain,
  TerritoryNpc,
  TileClaim,
  Tile,
  TownStockEntry,
} from './types';
export { Skill } from './types';
export { EQUIPMENT_SLOTS, LOG_KINDS, RARITY_ORDER, SKILL_NAMES } from './types';
export {
  gatheringBonusChance,
  gatheringYieldBonus,
  canEquipItem,
  canUseItem,
  createFreshLogsAtTime,
  describeStructure,
  enemyRarityIndex,
  getEnemyConfig,
  getItemConfig,
  getItemConfigByKey,
  getGoldAmount,
  getPlayerStats,
  getStructureConfig,
  isGatheringStructure,
  isAnimalEnemyType,
  isEquippableItem,
  isRecipePage,
  makeGoldStack,
  skillLevelThreshold,
  structureActionLabel,
};
export {
  getCurrentTile,
  getEnemiesAt,
  getEnemyAt,
  getHostileEnemyIds,
  getPlayerClaimedTiles,
  getTileAt,
  getVisibleTiles,
} from './stateWorldQueries';
export type { VisibleTilesState } from './stateWorldQueries';
export { getCurrentHexClaimStatus } from './stateClaims';
export { getSafePathToTile } from './statePathfinding';
export {
  claimCurrentHex,
  interactWithStructure,
  setHomeHex,
} from './stateWorldActions';
export {
  craftRecipe,
  getRecipeBookEntries,
  getRecipeBookRecipes,
} from './stateCrafting';
export {
  buyTownItem,
  dropEquippedItem,
  dropInventoryItem,
  getTownStock,
  hasEquippableInventoryItems,
  isOffhandSlotDisabled,
  prospectInventory,
  prospectInventoryItem,
  sellAllItems,
  sellInventoryItem,
  setInventoryItemLocked,
  sortInventory,
  takeAllTileItems,
  takeTileItem,
} from './stateInventoryActions';
export {
  attackCombatEnemy,
  getCombatAutomationDelay,
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
  progressCombat,
  startCombat,
} from './stateCombat';

export const HARVEST_MOON_RESOURCE_TYPE_CHANCES = HARVEST_MOON_RESOURCE_CHANCES;

const CONSUMABLE_COOLDOWN_MS = 2_000;

import type {
  AbilityId,
  Enemy,
  EquipmentSlot,
  GameState,
  GatheringStructureType,
  Item,
  Player,
  PlayerStatusEffect,
  StatusEffectId,
  Tile,
  TownStockEntry,
} from './types';

export function createGame(
  radius = WORLD_RADIUS,
  seed = `world-${Date.now()}`,
): GameState {
  const baseStats = getPlayerBaseStatsForLevel(1);
  const state: GameState = {
    seed,
    radius,
    homeHex: { q: 0, r: 0 },
    turn: 0,
    worldTimeMs: 0,
    dayPhase: 'night',
    bloodMoonActive: false,
    bloodMoonCheckedTonight: false,
    bloodMoonCycle: 0,
    harvestMoonActive: false,
    harvestMoonCheckedTonight: false,
    harvestMoonCycle: 0,
    lastEarthshakeDay: -1,
    gameOver: false,
    logSequence: 3,
    logs: createFreshLogsAtTime(seed, 0),
    tiles: {},
    enemies: {},
    combat: null,
    player: {
      coord: { q: 0, r: 0 },
      level: 1,
      masteryLevel: 0,
      xp: 0,
      hp: baseStats.maxHp,
      baseMaxHp: baseStats.maxHp,
      mana: 12,
      baseMaxMana: 12,
      hunger: 100,
      thirst: 100,
      baseAttack: baseStats.attack,
      baseDefense: baseStats.defense,
      skills: makeStartingSkills(),
      learnedRecipeIds: [...STARTING_RECIPE_IDS],
      statusEffects: [],
      consumableCooldownEndsAt: 0,
      inventory: [
        makeStarterWeapon(),
        makeStarterArmor('chest', ItemId.SettlerVest, 1, 1),
        makeConsumable('starter-ration', ItemId.TrailRation, 1, 10, 15, 2),
      ],
      equipment: {},
    },
  };

  cacheSafeStart(state);
  return state;
}
export function moveToTile(state: GameState, target: HexCoord): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const current = state.player.coord;
  if (hexDistance(current, target) !== 1) {
    return message(state, t('game.message.travel.oneHexAtATime'));
  }

  const next = cloneForWorldMutation(state);
  ensureTileState(next, target);
  const tile = next.tiles[hexKey(target)];

  if (!isPassable(tile.terrain)) {
    return message(next, t('game.message.travel.blockedTerrain'));
  }

  next.turn += 1;
  applySurvivalDecay(next);
  next.player.coord = target;

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, target);
    return next;
  }

  const hostileEnemyIds = getHostileEnemyIds(next, target);
  if (hostileEnemyIds.length > 0) {
    next.combat = createCombatState(
      next,
      target,
      hostileEnemyIds,
      next.worldTimeMs,
    );
    addLog(
      next,
      'combat',
      t(
        hostileEnemyIds.length === 1
          ? 'game.message.combat.encounter.one'
          : 'game.message.combat.encounter.other',
        { count: hostileEnemyIds.length },
      ),
    );
    return next;
  }

  addLog(
    next,
    'movement',
    t('game.message.travel.toHex', { q: target.q, r: target.r }),
  );
  return next;
}

export function moveAlongSafePath(
  state: GameState,
  target: HexCoord,
): GameState {
  const path = getSafePathToTile(state, target);
  if (!path || path.length === 0) {
    return path ? state : message(state, t('game.message.travel.noSafePath'));
  }

  let next = state;
  for (const step of path) {
    next = moveToTile(next, step);
    if (next === state || next.gameOver || next.combat) {
      return next;
    }
  }

  return next;
}

export function syncBloodMoon(
  state: GameState,
  worldTimeMinutes: number,
): GameState {
  const minutes = normalizeWorldMinutes(worldTimeMinutes);
  const phase = getDayPhase(minutes);

  if (state.dayPhase !== phase) {
    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    next.dayPhase = phase;
    addLog(
      next,
      'system',
      phase === 'night'
        ? t('game.message.time.nightFalls')
        : t('game.message.time.morningBreaks'),
    );
    return syncBloodMoon(next, minutes);
  }

  if (isBloodMoonRiseWindow(minutes)) {
    if (state.bloodMoonCheckedTonight && state.harvestMoonCheckedTonight) {
      return state;
    }

    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    next.bloodMoonCheckedTonight = true;
    next.harvestMoonCheckedTonight = true;

    const rng = createRng(`${state.seed}:blood-moon:${state.bloodMoonCycle}`);
    if (rng() < BLOOD_MOON_CHANCE) {
      next.bloodMoonActive = true;
      next.harvestMoonActive = false;
      syncEnemyBloodMoonState(next.enemies, true);
      const spawnedCount = spawnBloodMoonEnemies(next);
      addLog(next, 'combat', t('game.message.bloodMoon.begin'));
      if (spawnedCount > 0) {
        addLog(
          next,
          'combat',
          t(
            spawnedCount === 1
              ? 'game.message.bloodMoon.foes.one'
              : 'game.message.bloodMoon.foes.other',
            { count: spawnedCount },
          ),
        );
      }
      return next;
    }

    const harvestRng = createRng(
      `${state.seed}:harvest-moon:${state.harvestMoonCycle}`,
    );
    if (harvestRng() < HARVEST_MOON_CHANCE) {
      next.harvestMoonActive = true;
      const spawnedCount = spawnHarvestMoonResources(next);
      addLog(next, 'system', t('game.message.harvestMoon.begin'));
      if (spawnedCount > 0) {
        addLog(
          next,
          'loot',
          t(
            spawnedCount === 1
              ? 'game.message.harvestMoon.hexes.one'
              : 'game.message.harvestMoon.hexes.other',
            { count: spawnedCount },
          ),
        );
      }
    }
    return next;
  }

  if (
    phase === 'day' &&
    (state.bloodMoonActive ||
      state.bloodMoonCheckedTonight ||
      state.harvestMoonActive ||
      state.harvestMoonCheckedTonight ||
      state.lastEarthshakeDay !== getWorldDayIndex(state.worldTimeMs))
  ) {
    const next = cloneForWorldEventMutation(state);
    next.worldTimeMs = worldTimeMsFromMinutes(minutes, state.worldTimeMs);
    const wasBloodMoonActive = next.bloodMoonActive;
    const wasHarvestMoonActive = next.harvestMoonActive;
    next.bloodMoonActive = false;
    next.bloodMoonCheckedTonight = false;
    next.bloodMoonCycle += 1;
    next.harvestMoonActive = false;
    next.harvestMoonCheckedTonight = false;
    next.harvestMoonCycle += 1;
    syncEnemyBloodMoonState(next.enemies, false);
    maybeTriggerEarthshake(next);
    if (wasBloodMoonActive) {
      addLog(next, 'combat', t('game.message.bloodMoon.end'));
    }
    if (wasHarvestMoonActive) {
      addLog(next, 'system', t('game.message.harvestMoon.end'));
    }
    return next;
  }

  return state;
}

export function triggerEarthshake(state: GameState): GameState {
  const next = cloneForWorldEventMutation(state);
  if (!openEarthshakeDungeon(next, true)) {
    addLog(next, 'system', t('game.message.earthshake.noGround'));
  }
  return next;
}

export function syncPlayerStatusEffects(
  state: GameState,
  worldTimeMs: number,
): GameState {
  const next = copyGameState(state, { player: true });
  next.worldTimeMs = worldTimeMs;

  if (!processPlayerStatusEffects(next)) {
    return state;
  }

  return next;
}

export function activateInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (state.gameOver) return state;

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (!item) return message(state, t('game.message.item.notInPack'));

  if (isRecipePage(item) || canUseItem(item, state.player.learnedRecipeIds)) {
    return applyInventoryItemUse(state, itemId);
  }

  return equipItem(state, itemId);
}

export function equipItem(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const item = state.player.inventory[itemIndex];
  if (hasItemTag(item, GAME_TAGS.item.resource))
    return message(
      state,
      t('game.message.equipment.resourcesCannotBeEquipped'),
    );

  if (!item.slot)
    return message(state, t('game.message.equipment.cannotEquip'));

  const next = cloneForPlayerMutation(state);
  next.player.inventory.splice(itemIndex, 1);

  if (
    item.slot === EquipmentSlotId.Offhand &&
    itemOccupiesOffhand(next.player.equipment.weapon)
  ) {
    return message(state, t('game.message.equipment.offhandDisabled'));
  }

  const replaced = next.player.equipment[item.slot];
  if (replaced) addItemToInventory(next.player.inventory, replaced);
  next.player.equipment[item.slot] = item;
  if (item.slot === EquipmentSlotId.Weapon && itemOccupiesOffhand(item)) {
    const offhand = next.player.equipment.offhand;
    if (offhand) {
      addItemToInventory(next.player.inventory, offhand);
      delete next.player.equipment.offhand;
    }
  }
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(
    next,
    'system',
    t('game.message.equipment.equip', {
      item: item.name,
      slot: item.slot ? formatEquipmentSlotLabel(item.slot) : '',
    }),
  );
  return next;
}

export function useItem(state: GameState, itemId: string): GameState {
  return applyInventoryItemUse(state, itemId);
}

function applyInventoryItemUse(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const item = state.player.inventory[itemIndex];
  if (isRecipePage(item)) {
    if (
      item.recipeId &&
      state.player.learnedRecipeIds.includes(item.recipeId)
    ) {
      return message(
        state,
        t('game.crafting.alreadyKnown', {
          recipe: item.name.replace(/^Recipe: /, ''),
        }),
      );
    }
    const next = cloneForPlayerMutation(state);
    learnRecipe(next, item, RECIPE_BOOK_RECIPES, addLog);
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    return next;
  }
  if (!hasItemTag(item, GAME_TAGS.item.consumable))
    return message(state, t('game.message.item.cannotUse'));
  if ((state.player.consumableCooldownEndsAt ?? 0) > state.worldTimeMs) {
    return message(
      state,
      t('game.message.useItem.cooldown', {
        seconds: formatCooldownSeconds(
          (state.player.consumableCooldownEndsAt ?? 0) - state.worldTimeMs,
        ),
      }),
    );
  }

  const next =
    item.itemKey === ItemId.HomeScroll
      ? cloneForPlayerCombatMutation(state)
      : cloneForPlayerMutation(state);
  if (item.itemKey === ItemId.HomeScroll) {
    startConsumableCooldown(next);
    teleportHome(next, itemIndex, item);
    return next;
  }
  consumeItem(next, itemIndex, item);
  return next;
}

export function unequipItem(state: GameState, slot: EquipmentSlot): GameState {
  if (state.gameOver) return state;

  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, t('game.message.equipment.slotEmpty'));

  const next = cloneForPlayerMutation(state);
  delete next.player.equipment[slot];
  addItemToInventory(next.player.inventory, equipped);
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(
    next,
    'system',
    t('game.message.equipment.unequip', { item: equipped.name }),
  );
  return next;
}
function consumeItem(state: GameState, itemIndex: number, item: Item) {
  const effects = resolveConsumableUseEffects(state, item);
  if (effects.total === 0) {
    addLog(
      state,
      'system',
      t('game.message.useItem.noEffect', { item: item.name }),
    );
    return;
  }

  consumeInventoryItem(state.player.inventory, itemIndex, item);
  startConsumableCooldown(state);
  state.player.hp += effects.healing;
  state.player.mana += effects.mana;
  state.player.hunger += effects.hunger;
  state.player.thirst = (state.player.thirst ?? 100) + effects.thirst;
  addLog(
    state,
    'survival',
    t('game.message.useItem', {
      item: item.name,
      healing:
        effects.healing > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.healing', { amount: effects.healing })}`
          : '',
      mana:
        effects.mana > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.mana', { amount: effects.mana })}`
          : '',
      hunger:
        effects.hunger > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.hunger', { amount: effects.hunger })}`
          : '',
      thirst:
        effects.thirst > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.thirst', { amount: effects.thirst })}`
          : '',
    }),
  );
}

function startConsumableCooldown(state: GameState) {
  state.player.consumableCooldownEndsAt =
    state.worldTimeMs + CONSUMABLE_COOLDOWN_MS;
}

function formatCooldownSeconds(remainingMs: number) {
  const seconds = Math.max(0.1, Math.ceil(remainingMs / 100) / 10);
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1);
}

function resolveConsumableUseEffects(state: GameState, item: Item) {
  const stats = getPlayerStats(state.player);
  const restoreProfile = getConsumableRestoreProfile(item);
  const healing = Math.max(
    0,
    Math.min(
      stats.maxHp - state.player.hp,
      resolvePercentRestoreAmount(stats.maxHp, restoreProfile.healingPercent),
    ),
  );
  const mana = Math.max(
    0,
    Math.min(
      stats.maxMana - state.player.mana,
      resolvePercentRestoreAmount(stats.maxMana, restoreProfile.manaPercent),
    ),
  );
  const hunger = Math.max(0, Math.min(100 - state.player.hunger, item.hunger));
  const thirst = Math.max(
    0,
    Math.min(100 - (state.player.thirst ?? 100), item.thirst ?? 0),
  );

  return {
    healing,
    mana,
    hunger,
    thirst,
    total: healing + mana + hunger + thirst,
  };
}
