import { hexDistance, hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import { Skill } from './types';
import {
  BLOOD_MOON_CHANCE,
  HARVEST_MOON_CHANCE,
  HARVEST_MOON_RESOURCE_CHANCES,
} from './config';
import { createRng } from './random';
import { getEnemyConfig, isAnimalEnemyType } from './content/enemies';
import { getItemConfig, getItemConfigByKey } from './content/items';
import { getStructureConfig } from './content/structures';
import { enemyRarityIndex, syncEnemyBloodMoonState } from './combat';
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
  canEquipItem,
  canUseItem,
  getGoldAmount,
  isEquippableItem,
  isRecipePage,
  makeGoldStack,
} from './inventory';
import {
  gatheringBonusChance,
  gatheringYieldBonus,
  getPlayerStats,
  skillLevelThreshold,
} from './progression';
import { isPassable } from './shared';
import {
  describeStructure,
  ensureTileState,
  isGatheringStructure,
  structureActionLabel,
} from './world';
import { copyGameState } from './stateClone';
import {
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
} from './stateSurvival';
import {
  activateInventoryItem,
  equipItem,
  unequipItem,
  useItem,
} from './stateItemActions';
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
  SecondaryStatKey,
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
export { createGame } from './stateFactory';
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
  activateInventoryItem,
  equipItem,
  unequipItem,
  useItem,
} from './stateItemActions';
export {
  corruptInventoryItem,
  enchantInventoryItem,
  reforgeInventoryItem,
} from './stateItemModificationActions';
export {
  attackCombatEnemy,
  forfeitCombat,
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
