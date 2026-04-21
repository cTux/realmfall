import { hexDistance, hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import {
  formatAbilityLabel,
  formatEquipmentSlotLabel,
  formatStatusEffectLabel,
} from '../i18n/labels';
import { Skill } from './types';
import type { LogRichSegment } from './types';
import {
  BLOOD_MOON_CHANCE,
  HARVEST_MOON_CHANCE,
  HARVEST_MOON_RESOURCE_CHANCES,
  STARTING_RECIPE_IDS,
  WORLD_RADIUS,
} from './config';
import { createRng } from './random';
import { getAbilityDefinition } from './abilityRuntime';
import { getEnemyConfig, isAnimalEnemyType } from './content/enemies';
import {
  getItemConfig,
  getItemConfigByKey,
  hasItemTag,
  itemOccupiesOffhand,
} from './content/items';
import { EquipmentSlotId, ItemId, StatusEffectTypeId } from './content/ids';
import { getStructureConfig } from './content/structures';
import {
  createCombatActorState,
  DEFAULT_ENEMY_MANA,
  enemyRarityIndex,
  syncEnemyBloodMoonState,
} from './combat';
import {
  consumeRequirements,
  describeRequirement,
  getRecipeBookEntries as getRecipeBookEntriesFromDefinitions,
  getRecipeBookRecipes as getRecipeBookRecipesFromDefinitions,
  getRecipeRequiredStructure,
  hasAllRequirements,
  learnRecipe,
  pickSatisfiedRequirement,
  RECIPE_BOOK_RECIPES,
} from './crafting';
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
  materializeRecipeOutput,
} from './inventory';
import { getPlayerBaseStatsForLevel } from './balance';
import {
  DEFAULT_CRITICAL_STRIKE_CHANCE,
  DEFAULT_CRITICAL_STRIKE_DAMAGE,
  DEFAULT_DODGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_REDUCTION,
} from './itemSecondaryStats';
import { GAME_TAGS } from './content/tags';
import {
  getConsumableRestoreProfile,
  resolvePercentRestoreAmount,
} from './consumables';
import {
  gatheringBonusChance,
  gatheringYieldBonus,
  gainSkillXp,
  gainXp,
  getPlayerStats,
  makeStartingSkills,
  skillLevelThreshold,
} from './progression';
import { isPassable } from './shared';
import {
  buildTile,
  cacheSafeStart,
  describeStructure,
  ensureTileState,
  isGatheringStructure,
  normalizeStructureState,
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
import { dropEnemyRewards } from './stateRewards';
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

export function getRecipeBookRecipes(learnedRecipeIds?: string[]) {
  return getRecipeBookRecipesFromDefinitions(
    RECIPE_BOOK_RECIPES,
    learnedRecipeIds,
  );
}

export function getRecipeBookEntries(learnedRecipeIds: string[]) {
  return getRecipeBookEntriesFromDefinitions(
    RECIPE_BOOK_RECIPES,
    learnedRecipeIds,
  );
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

export function attackCombatEnemy(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (!state.combat.started)
    return message(state, t('game.message.combat.pressStart'));

  return progressCombat(state);
}

export function progressCombat(state: GameState): GameState {
  if (!state.combat || !state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function startCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (state.combat.started) return state;

  const next = cloneForWorldMutation(state);
  next.combat!.started = true;
  addLog(
    next,
    'combat',
    t(
      next.combat!.enemyIds.length === 1
        ? 'game.message.combat.begin.one'
        : 'game.message.combat.begin.other',
      { count: next.combat!.enemyIds.length },
    ),
  );
  resolveCombat(next);
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

export function getCombatAutomationDelay(
  state: Pick<GameState, 'combat' | 'player' | 'enemies'>,
  worldTimeMs: number,
) {
  const { combat } = state;
  if (!combat || combat.enemyIds.length === 0) return null;

  const eventTimes = [
    combat.player.casting?.endsAt,
    getNextActorReadyAt(combat.player, worldTimeMs),
    getNextCombatStatusEffectEventAt(state.player.statusEffects, worldTimeMs),
    ...combat.enemyIds.flatMap((enemyId) => {
      const actor = combat.enemies[enemyId];
      if (!actor) return [] as Array<number | undefined>;

      return [
        actor.casting?.endsAt,
        getNextActorReadyAt(actor, worldTimeMs),
        getNextCombatStatusEffectEventAt(
          state.enemies[enemyId]?.statusEffects,
          worldTimeMs,
        ),
      ];
    }),
  ].filter((value): value is number => Number.isFinite(value));

  if (eventTimes.length === 0) return null;

  return Math.max(0, Math.min(...eventTimes) - worldTimeMs);
}

function createCombatState(
  state: GameState,
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
): GameState['combat'] {
  return {
    coord,
    enemyIds: [...enemyIds],
    started: false,
    player: createCombatActorState(
      worldTimeMs,
      getPlayerStats(state.player).abilityIds,
    ),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [
        enemyId,
        createCombatActorState(worldTimeMs, state.enemies[enemyId]?.abilityIds),
      ]),
    ),
  };
}

function resolveCombat(state: GameState) {
  if (!state.combat) return false;

  let changed = false;
  let keepResolving = true;

  while (state.combat && keepResolving) {
    keepResolving = false;
    const playerEffectsChanged = processPlayerStatusEffects(state);
    const enemyEffectsChanged = processEnemyStatusEffects(state);
    if (playerEffectsChanged || enemyEffectsChanged) {
      changed = true;
      if (state.player.hp <= 0 && state.combat) {
        respawnAtNearestTown(state, state.combat.coord);
        return true;
      }
      if (!state.combat) return true;
    }

    const duePlayerCast =
      state.combat.player.casting &&
      state.combat.player.casting.endsAt <= state.worldTimeMs
        ? state.combat.player.casting
        : null;
    const dueEnemyCasts = state.combat.enemyIds
      .map((enemyId) => ({ enemyId, actor: state.combat?.enemies[enemyId] }))
      .filter((entry) => Boolean(entry.actor?.casting))
      .map(({ enemyId, actor }) => ({ enemyId, cast: actor!.casting! }))
      .filter(({ cast }) => cast.endsAt <= state.worldTimeMs);

    if (duePlayerCast || dueEnemyCasts.length > 0) {
      changed = true;
      keepResolving = true;
      if (duePlayerCast) state.combat.player.casting = null;
      dueEnemyCasts.forEach(({ enemyId }) => {
        const actor = state.combat?.enemies[enemyId];
        if (actor) actor.casting = null;
      });

      if (duePlayerCast) {
        applyPlayerAbility(
          state,
          duePlayerCast.abilityId,
          duePlayerCast.targetId,
        );
      }
      dueEnemyCasts.forEach(({ enemyId, cast }) => {
        applyEnemyAbility(state, enemyId, cast.abilityId);
      });
      if (!state.combat) return true;
    }

    const startedPlayerCast = startPlayerCasts(state);
    const startedEnemyCast = startEnemyCasts(state);
    changed = changed || startedPlayerCast || startedEnemyCast;
    keepResolving = keepResolving || startedPlayerCast || startedEnemyCast;
  }

  return changed;
}

function startPlayerCasts(state: GameState) {
  if (!state.combat) return false;

  const actor = state.combat.player;
  const now = state.worldTimeMs;
  if (actor.casting) return false;

  const abilityId = actor.abilityIds.find((candidate) => {
    const ability = getAbilityDefinition(candidate);
    const targetId = selectAbilityTargetId(state, 'player', candidate);
    return (
      canActorCastAbility(actor, candidate, now) &&
      state.player.mana >= ability.manaCost &&
      targetId !== null
    );
  });
  if (!abilityId) return false;

  const targetId = selectAbilityTargetId(state, 'player', abilityId);
  if (!targetId) return false;

  state.player.mana -= getAbilityDefinition(abilityId).manaCost;
  startAbilityCast(
    actor,
    abilityId,
    targetId,
    now,
    getPlayerStats(state.player).attackSpeed ?? 1,
  );
  return true;
}

function startEnemyCasts(state: GameState) {
  if (!state.combat) return false;

  const now = state.worldTimeMs;
  let changed = false;

  state.combat.enemyIds.forEach((enemyId) => {
    const actor = state.combat?.enemies[enemyId];
    if (!actor || actor.casting || !state.enemies[enemyId]) return;

    const abilityId = actor.abilityIds.find((candidate) => {
      const definition = getAbilityDefinition(candidate);
      const targetId = selectAbilityTargetId(state, enemyId, candidate);
      return (
        canActorCastAbility(actor, candidate, now) &&
        targetId !== null &&
        canEnemyUseAbility(state, enemyId, candidate, definition.target)
      );
    });

    if (!abilityId) return;

    const targetId = selectAbilityTargetId(state, enemyId, abilityId);
    if (!targetId) return;

    state.enemies[enemyId]!.mana = Math.max(
      0,
      getEnemyMana(state.enemies[enemyId]!) -
        getAbilityDefinition(abilityId).manaCost,
    );
    startAbilityCast(
      actor,
      abilityId,
      targetId,
      now,
      getEnemyCombatAttackSpeed(state.enemies[enemyId]!),
    );
    changed = true;
  });

  return changed;
}

function startAbilityCast(
  actor: NonNullable<GameState['combat']>['player'],
  abilityId: AbilityId,
  targetId: string,
  now: number,
  attackSpeed = 1,
) {
  const ability = getAbilityDefinition(abilityId);
  const effectiveGlobalCooldownMs = scaledCooldownMs(
    actor.globalCooldownMs,
    attackSpeed,
  );
  const effectiveAbilityCooldownMs = scaledCooldownMs(
    ability.cooldownMs,
    attackSpeed,
  );
  actor.effectiveGlobalCooldownMs = effectiveGlobalCooldownMs;
  actor.effectiveCooldownMs = {
    ...(actor.effectiveCooldownMs ?? {}),
    [abilityId]: effectiveAbilityCooldownMs,
  };
  actor.globalCooldownEndsAt = now + effectiveGlobalCooldownMs;
  actor.cooldownEndsAt[abilityId] = now + effectiveAbilityCooldownMs;
  actor.casting = {
    abilityId,
    targetId,
    endsAt: now + ability.castTimeMs,
  };
}

export function getEnemyCombatAttackSpeed(enemy: Enemy) {
  if (!enemy.statusEffects?.length) return 1;

  return Math.max(
    0.25,
    1 +
      getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Frenzy, 20) /
        100 -
      getCombatStatusValue(
        enemy.statusEffects,
        StatusEffectTypeId.Chilling,
        20,
      ) /
        100,
  );
}

function scaledCooldownMs(baseCooldownMs: number, attackSpeed: number) {
  const safeAttackSpeed = Math.max(0.01, attackSpeed);
  return Math.max(1, Math.round(baseCooldownMs / safeAttackSpeed));
}

function applyPlayerAbility(
  state: GameState,
  abilityId: AbilityId,
  targetId: string,
) {
  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerStats(state.player);
  const enemyTargets = resolveEnemyTargetsForPlayerAbility(
    state,
    ability,
    targetId,
  );
  let totalDamage = 0;

  for (const effect of ability.effects) {
    if (effect.kind === 'damage') {
      for (const enemy of enemyTargets) {
        if (enemy.hp <= 0) continue;
        const damage = dealPlayerDamageToEnemy(
          state,
          abilityId,
          enemy,
          effect,
          playerStats,
        );
        totalDamage += damage;
      }
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healPlayerTargets(
        state,
        ability,
        effect,
        playerStats.attack,
      );
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.playerAbilityHeal', {
            ability: formatAbilityLabel(ability.id),
            amount: healed,
          }),
          playerHealRichText(ability.id, healed, playerStats.attack),
        );
      }
      continue;
    }

    const applied = applyPlayerStatusTargets(state, ability, effect, targetId);
    if (applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.playerAbilityStatus', {
          ability: formatAbilityLabel(ability.id),
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
        applied === 1 && enemyTargets.length === 1
          ? playerStatusRichText(
              enemyTargets[0],
              ability.id,
              effect.statusEffectId,
            )
          : playerStatusRichText(undefined, ability.id, effect.statusEffectId),
      );
    }
  }

  if (totalDamage > 0) {
    applyLifesteal(state, totalDamage, playerStats);
  }

  enemyTargets.forEach((enemy) => {
    if (enemy.hp <= 0) {
      handleEnemyDefeat(state, enemy);
    }
  });
}

function applyPlayerOnHitEffects(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
  damage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  if (damage <= 0) return;

  applyLifesteal(state, damage, playerStats);
  applyStatusProcToEnemy(
    state,
    enemy,
    'bleeding',
    playerStats.bleedChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'poison',
    playerStats.poisonChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'burning',
    playerStats.burningChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToEnemy(
    state,
    enemy,
    'chilling',
    playerStats.chillingChance ?? 0,
    playerStats.attack,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToPlayer(
    state,
    'power',
    playerStats.powerBuffChance ?? 0,
    playerStats.attackSpeed ?? 1,
  );
  applyStatusProcToPlayer(
    state,
    'frenzy',
    playerStats.frenzyBuffChance ?? 0,
    playerStats.attackSpeed ?? 1,
  );
}

function applyLifesteal(
  state: GameState,
  damage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  const lifestealChance = playerStats.lifestealChance ?? 0;
  if (lifestealChance <= 0) return;

  const procCount = resolveProcCount(
    state,
    'player:lifesteal',
    lifestealChance,
  );
  if (procCount <= 0) return;

  const healPerProc = Math.max(
    1,
    Math.floor(
      getPlayerStats(state.player).maxHp *
        ((playerStats.lifestealAmount ?? 0) / 100),
    ),
  );
  if (damage <= 0 || healPerProc <= 0) return;

  state.player.hp = Math.min(
    getPlayerStats(state.player).maxHp,
    state.player.hp + healPerProc * procCount,
  );
}

function applyStatusProcToEnemy(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
  effectId: 'bleeding' | 'poison' | 'burning' | 'chilling',
  chance: number,
  attackValue: number,
  attackSpeed: number,
) {
  const procCount = resolveProcCount(
    state,
    `enemy:${enemy.id}:${effectId}`,
    chance,
  );
  if (procCount <= 0) return;

  const suppressChance = 0;
  if (
    suppressChance > 0 &&
    resolveProcCount(
      state,
      `enemy:${enemy.id}:suppress:${effectId}`,
      suppressChance,
    ) > 0
  ) {
    return;
  }

  applyStatusEffectToEnemy(state, enemy, {
    id:
      effectId === 'poison'
        ? StatusEffectTypeId.Poison
        : effectId === 'burning'
          ? StatusEffectTypeId.Burning
          : effectId === 'bleeding'
            ? StatusEffectTypeId.Bleeding
            : StatusEffectTypeId.Chilling,
    value:
      effectId === 'poison'
        ? 1
        : effectId === 'burning'
          ? Math.max(1, attackValue)
          : effectId === 'bleeding'
            ? Math.max(1, attackValue)
            : 20,
    expiresAt: state.worldTimeMs + 10_000,
    tickIntervalMs:
      effectId === 'chilling'
        ? undefined
        : Math.max(1, Math.round(2_000 / Math.max(0.01, attackSpeed))),
    stacks: effectId === 'poison' || effectId === 'burning' ? procCount : 1,
  });
}

function applyStatusProcToPlayer(
  state: GameState,
  effectId: 'power' | 'frenzy',
  chance: number,
  attackSpeed: number,
) {
  const procCount = resolveProcCount(state, `player:${effectId}`, chance);
  if (procCount <= 0) return;

  applyStatusEffectToPlayer(state, {
    id:
      effectId === 'power'
        ? StatusEffectTypeId.Power
        : StatusEffectTypeId.Frenzy,
    value: effectId === 'power' ? 10 : 20,
    expiresAt: state.worldTimeMs + 10_000,
    tickIntervalMs: Math.max(
      1,
      Math.round(2_000 / Math.max(0.01, attackSpeed)),
    ),
    stacks: 1,
  });
}

function dealPlayerDamageToEnemy(
  state: GameState,
  abilityId: AbilityId,
  enemy: NonNullable<GameState['enemies'][string]>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'damage' }
  >,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  const critCount = resolveProcCount(
    state,
    `player:${enemy.id}:${abilityId}:crit`,
    playerStats.criticalStrikeChance ?? 0,
  );
  const critMultiplier = Math.pow(
    Math.max(1, (playerStats.criticalStrikeDamage ?? 100) / 100),
    Math.max(0, critCount),
  );
  const baseDamage = Math.max(
    0,
    Math.round(
      playerStats.attack * effect.powerMultiplier + (effect.flatPower ?? 0),
    ),
  );
  const damage =
    baseDamage <= 0
      ? 0
      : Math.max(
          0,
          Math.round(
            Math.max(0, baseDamage - getEnemyCombatDefense(enemy)) *
              critMultiplier,
          ),
        );
  const damageResolution = resolveIncomingDamageByChances(
    state,
    `player:${enemy.id}:${abilityId}`,
    damage,
    getEnemyDodgeChance(enemy),
    0,
    getEnemySuppressDamageChance(enemy),
    getEnemySuppressDamageReduction(enemy),
  );
  enemy.hp = Math.max(0, enemy.hp - damageResolution.damage);
  applyPlayerOnHitEffects(state, enemy, damageResolution.damage, playerStats);
  if (
    damageResolution.outcome !== 'dodged' &&
    damageResolution.outcome !== 'blocked' &&
    damageResolution.outcome !== 'absorbed'
  ) {
    maybeApplyConfiguredStatusToEnemy(state, enemy, effect, playerStats.attack);
  }
  addLog(
    state,
    'combat',
    formatPlayerDamageLog(enemy.name, abilityId, damageResolution),
    playerDamageRichText(
      enemy,
      abilityId,
      damageResolution,
      playerStats.attack,
    ),
  );
  return damageResolution.damage;
}

function healPlayerTargets(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'heal' }
  >,
  power: number,
) {
  const targets =
    ability.target === 'allAllies' ? [state.player] : [state.player];
  const total = targets.reduce((sum, target) => {
    const amount = Math.max(
      1,
      Math.round(
        (power * effect.powerMultiplier + (effect.flatPower ?? 0)) /
          Math.max(1, effect.splitDivisor ?? 1),
      ),
    );
    const maxHp = getPlayerStats(state.player).maxHp;
    const healed = Math.max(0, Math.min(maxHp - target.hp, amount));
    target.hp += healed;
    return sum + healed;
  }, 0);

  return total;
}

function applyPlayerStatusTargets(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'applyStatus' }
  >,
  targetId: string,
) {
  if (
    ability.target === 'allEnemies' ||
    ability.target === 'enemy' ||
    ability.target === 'randomEnemy'
  ) {
    return resolveEnemyTargetsForPlayerAbility(state, ability, targetId).reduce(
      (count, enemy) =>
        count +
        (applyStatusEffectToEnemy(state, enemy, {
          id: effect.statusEffectId,
          value: effect.value,
          expiresAt: effect.permanent
            ? undefined
            : state.worldTimeMs + (effect.durationMs ?? 0),
          tickIntervalMs: effect.tickIntervalMs,
          stacks: effect.stacks ?? 1,
        })
          ? 1
          : 0),
      0,
    );
  }

  return applyStatusEffectToPlayer(state, {
    id: effect.statusEffectId,
    value: effect.value,
    expiresAt: effect.permanent
      ? undefined
      : state.worldTimeMs + (effect.durationMs ?? 0),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  })
    ? 1
    : 0;
}

function handleEnemyDefeat(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
) {
  if (!state.enemies[enemy.id]) return;

  gainXp(state, enemy.xp, addLog);
  dropEnemyRewards(state, enemy);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyDefeated', { enemy: enemy.name }),
    enemyDefeatedRichText(enemy),
  );
  delete state.enemies[enemy.id];
  syncCombatEnemies(state);
}

function resolveEnemyTargetsForPlayerAbility(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  targetId: string,
) {
  if (!state.combat) return [] as Enemy[];

  if (ability.target === 'allEnemies') {
    return state.combat.enemyIds
      .map((enemyId) => state.enemies[enemyId])
      .filter((enemy): enemy is Enemy => Boolean(enemy));
  }

  const target = state.enemies[targetId];
  return target ? [target] : [];
}

function healEnemyTargets(
  state: GameState,
  enemyId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'heal' }
  >,
) {
  const targets = resolveEnemyTargetsForEnemyAbility(state, enemyId, ability);
  const total = targets.reduce((sum, enemy) => {
    const amount = Math.max(
      1,
      Math.round(
        (getEnemyCombatAttack(state.enemies[enemyId]!) *
          effect.powerMultiplier +
          (effect.flatPower ?? 0)) /
          Math.max(1, effect.splitDivisor ?? 1),
      ),
    );
    const healed = Math.max(0, Math.min(enemy.maxHp - enemy.hp, amount));
    enemy.hp += healed;
    return sum + healed;
  }, 0);

  return total;
}

function applyEnemyStatusTargets(
  state: GameState,
  enemyId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'applyStatus' }
  >,
) {
  if (
    ability.target === 'allAllies' ||
    ability.target === 'randomAlly' ||
    ability.target === 'injuredAlly' ||
    ability.target === 'self'
  ) {
    return {
      applied: resolveEnemyTargetsForEnemyAbility(
        state,
        enemyId,
        ability,
      ).reduce(
        (count, enemy) =>
          count +
          (applyStatusEffectToEnemy(state, enemy, {
            id: effect.statusEffectId,
            value: effect.value,
            expiresAt: effect.permanent
              ? undefined
              : state.worldTimeMs + (effect.durationMs ?? 0),
            tickIntervalMs: effect.tickIntervalMs,
            stacks: effect.stacks ?? 1,
          })
            ? 1
            : 0),
        0,
      ),
      suppressed: 0,
    };
  }

  const result = applyEnemyStatusEffectToPlayer(
    state,
    {
      id: effect.statusEffectId,
      value: effect.value,
      expiresAt: effect.permanent
        ? undefined
        : state.worldTimeMs + (effect.durationMs ?? 0),
      tickIntervalMs: effect.tickIntervalMs,
      stacks: effect.stacks ?? 1,
    },
    `${enemyId}:${ability.id}:${effect.statusEffectId}`,
  );

  return {
    applied: result === 'applied' ? 1 : 0,
    suppressed: result === 'suppressed' ? 1 : 0,
  };
}

function maybeApplyConfiguredStatusToEnemy(
  state: GameState,
  enemy: Enemy,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'damage' }
  >,
  attackValue: number,
) {
  if (!effect.statusEffectId || !effect.statusChance) return;
  if (
    resolveProcCount(
      state,
      `enemy:${enemy.id}:${effect.statusEffectId}`,
      effect.statusChance,
    ) <= 0
  ) {
    return;
  }

  applyStatusEffectToEnemy(state, enemy, {
    id: effect.statusEffectId,
    value: Math.max(
      1,
      Math.round(
        attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0),
      ),
    ),
    expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  });
}

function maybeApplyConfiguredStatusToPlayer(
  state: GameState,
  effect: Extract<
    ReturnType<typeof getAbilityDefinition>['effects'][number],
    { kind: 'damage' }
  >,
  attackValue: number,
  abilityId: AbilityId,
  enemyId: string,
) {
  if (!effect.statusEffectId || !effect.statusChance) {
    return 'none' satisfies PlayerDebuffApplicationResult;
  }
  if (
    resolveProcCount(
      state,
      `player:${effect.statusEffectId}`,
      effect.statusChance,
    ) <= 0
  ) {
    return 'none' satisfies PlayerDebuffApplicationResult;
  }

  return applyEnemyStatusEffectToPlayer(
    state,
    {
      id: effect.statusEffectId,
      value: Math.max(
        1,
        Math.round(
          attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0),
        ),
      ),
      expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
      tickIntervalMs: effect.tickIntervalMs,
      stacks: effect.stacks ?? 1,
    },
    `${enemyId}:${abilityId}:${effect.statusEffectId}:configured`,
  );
}

function applyEnemyStatusEffectToPlayer(
  state: GameState,
  nextEffect: {
    id: StatusEffectId;
    value?: number;
    expiresAt?: number;
    tickIntervalMs?: number;
    stacks?: number;
  },
  seedKey: string,
) {
  if (
    resolveProcCount(
      state,
      `${seedKey}:suppress-debuff`,
      getPlayerStats(state.player).suppressDebuffChance ?? 0,
    ) > 0
  ) {
    return 'suppressed' satisfies PlayerDebuffApplicationResult;
  }

  return applyStatusEffectToPlayer(state, nextEffect)
    ? ('applied' satisfies PlayerDebuffApplicationResult)
    : ('none' satisfies PlayerDebuffApplicationResult);
}

function applyStatusEffectToEnemy(
  state: GameState,
  enemy: Enemy,
  nextEffect: {
    id: StatusEffectId;
    value?: number;
    expiresAt?: number;
    tickIntervalMs?: number;
    stacks?: number;
  },
) {
  const currentEffect = enemy.statusEffects?.find(
    (effect) => effect.id === nextEffect.id,
  );
  const merged = mergeStatusEffect(state, currentEffect, nextEffect);
  const changed =
    !currentEffect ||
    currentEffect.value !== merged.value ||
    currentEffect.expiresAt !== merged.expiresAt ||
    currentEffect.stacks !== merged.stacks;

  enemy.statusEffects = [
    ...(enemy.statusEffects ?? []).filter((effect) => effect.id !== merged.id),
    merged,
  ];
  return changed;
}

function applyStatusEffectToPlayer(
  state: GameState,
  nextEffect: {
    id: StatusEffectId;
    value?: number;
    expiresAt?: number;
    tickIntervalMs?: number;
    stacks?: number;
  },
) {
  const currentEffect = state.player.statusEffects.find(
    (effect) => effect.id === nextEffect.id,
  );
  const merged = mergeStatusEffect(state, currentEffect, nextEffect);
  const changed =
    !currentEffect ||
    currentEffect.value !== merged.value ||
    currentEffect.expiresAt !== merged.expiresAt ||
    currentEffect.stacks !== merged.stacks;

  state.player.statusEffects = [
    ...state.player.statusEffects.filter((effect) => effect.id !== merged.id),
    merged,
  ];
  return changed;
}

function mergeStatusEffect(
  state: GameState,
  currentEffect: PlayerStatusEffect | undefined,
  nextEffect: {
    id: StatusEffectId;
    value?: number;
    expiresAt?: number;
    tickIntervalMs?: number;
    stacks?: number;
  },
) {
  const stacks =
    nextEffect.id === StatusEffectTypeId.Poison ||
    nextEffect.id === StatusEffectTypeId.Burning
      ? Math.max(1, (currentEffect?.stacks ?? 0) + (nextEffect.stacks ?? 1))
      : (nextEffect.stacks ?? 1);

  return {
    id: nextEffect.id,
    value: nextEffect.value,
    expiresAt: nextEffect.expiresAt,
    tickIntervalMs: nextEffect.tickIntervalMs,
    lastProcessedAt: state.worldTimeMs,
    stacks,
  };
}

export function getEnemyCombatAttack(enemy: Enemy) {
  return Math.max(
    1,
    Math.round(
      enemy.attack *
        (1 +
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Power,
            10,
          ) /
            100) *
        (1 -
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Weakened,
            15,
          ) /
            100),
    ),
  );
}

export function getEnemyCriticalStrikeChance(_enemy: Enemy) {
  return DEFAULT_CRITICAL_STRIKE_CHANCE;
}

export function getEnemyCriticalStrikeDamage(_enemy: Enemy) {
  return DEFAULT_CRITICAL_STRIKE_DAMAGE;
}

export function getEnemyDodgeChance(_enemy: Enemy) {
  return DEFAULT_DODGE_CHANCE;
}

export function getEnemySuppressDamageChance(_enemy: Enemy) {
  return DEFAULT_SUPPRESS_DAMAGE_CHANCE;
}

export function getEnemySuppressDamageReduction(_enemy: Enemy) {
  return DEFAULT_SUPPRESS_DAMAGE_REDUCTION;
}

function getEnemyMana(enemy: Enemy) {
  return enemy.mana ?? enemy.maxMana ?? DEFAULT_ENEMY_MANA;
}

export function getEnemyCombatDefense(enemy: Enemy) {
  return Math.max(
    0,
    Math.round(
      enemy.defense *
        (1 +
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Guard,
            15,
          ) /
            100) *
        (1 -
          getCombatStatusValue(
            enemy.statusEffects,
            StatusEffectTypeId.Shocked,
            15,
          ) /
            100),
    ),
  );
}

function getCombatStatusValue(
  effects: PlayerStatusEffect[] | undefined,
  effectId: StatusEffectId,
  fallback = 0,
) {
  return (effects ?? []).reduce(
    (highest, effect) =>
      effect.id === effectId
        ? Math.max(highest, effect.value ?? fallback)
        : highest,
    0,
  );
}

type DamageOutcome = 'hit' | 'dodged' | 'blocked' | 'suppressed' | 'absorbed';

interface DamageResolution {
  damage: number;
  outcome: DamageOutcome;
}

type PlayerDebuffApplicationResult = 'applied' | 'suppressed' | 'none';

function resolveIncomingDamage(
  state: GameState,
  seedKey: string,
  incomingDamage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  return resolveIncomingDamageByChances(
    state,
    seedKey,
    incomingDamage,
    playerStats.dodgeChance ?? 0,
    playerStats.blockChance ?? 0,
    playerStats.suppressDamageChance ?? 0,
    playerStats.suppressDamageReduction ?? 0,
  );
}

function resolveIncomingDamageByChances(
  state: GameState,
  seedKey: string,
  incomingDamage: number,
  dodgeChance: number,
  blockChance: number,
  suppressDamageChance: number,
  suppressDamageReduction: number,
) {
  if (incomingDamage <= 0) {
    return { damage: 0, outcome: 'absorbed' } satisfies DamageResolution;
  }
  if (resolveProcCount(state, `${seedKey}:dodge`, dodgeChance) > 0) {
    return { damage: 0, outcome: 'dodged' } satisfies DamageResolution;
  }
  if (resolveProcCount(state, `${seedKey}:block`, blockChance) > 0) {
    return { damage: 0, outcome: 'blocked' } satisfies DamageResolution;
  }
  if (
    resolveProcCount(state, `${seedKey}:suppress`, suppressDamageChance) > 0
  ) {
    const suppressedDamage = Math.round(
      incomingDamage * (1 - Math.min(95, suppressDamageReduction) / 100),
    );
    return {
      damage: Math.max(1, suppressedDamage),
      outcome: 'suppressed',
    } satisfies DamageResolution;
  }

  return { damage: incomingDamage, outcome: 'hit' } satisfies DamageResolution;
}

function formatPlayerDamageLog(
  enemyName: string,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
) {
  if (damageResolution.outcome === 'dodged') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickDodged'
        : 'game.message.combat.playerAbilityDodged',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'suppressed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickSuppressed'
        : 'game.message.combat.playerAbilitySuppressed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
        damage: damageResolution.damage,
      },
    );
  }

  if (damageResolution.outcome === 'absorbed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKickAbsorbed'
        : 'game.message.combat.playerAbilityAbsorbed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  return t(
    abilityId === 'kick'
      ? 'game.message.combat.playerKick'
      : 'game.message.combat.playerAbilityDamage',
    {
      ability: formatAbilityLabel(abilityId),
      enemy: enemyName,
      damage: damageResolution.damage,
    },
  );
}

function formatEnemyDamageLog(
  enemyName: string,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
) {
  if (damageResolution.outcome === 'dodged') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickDodged'
        : 'game.message.combat.enemyAbilityDodged',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'blocked') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickBlocked'
        : 'game.message.combat.enemyAbilityBlocked',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  if (damageResolution.outcome === 'suppressed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickSuppressed'
        : 'game.message.combat.enemyAbilitySuppressed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
        damage: damageResolution.damage,
      },
    );
  }

  if (damageResolution.outcome === 'absorbed') {
    return t(
      abilityId === 'kick'
        ? 'game.message.combat.enemyKickAbsorbed'
        : 'game.message.combat.enemyAbilityAbsorbed',
      {
        ability: formatAbilityLabel(abilityId),
        enemy: enemyName,
      },
    );
  }

  return t(
    abilityId === 'kick'
      ? 'game.message.combat.enemyKick'
      : 'game.message.combat.enemyAbilityDamage',
    {
      ability: formatAbilityLabel(abilityId),
      enemy: enemyName,
      damage: damageResolution.damage,
    },
  );
}

function formatSuppressedEnemyDebuffLog(
  enemyName: string,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return t('game.message.combat.enemyAbilityDebuffSuppressed', {
    ability: formatAbilityLabel(abilityId),
    enemy: enemyName,
    effect: formatStatusEffectLabel(effectId),
  });
}

function textSegment(text: string): LogRichSegment {
  return { kind: 'text', text };
}

function entitySegment(
  text: string,
  rarity?: NonNullable<Enemy['rarity']>,
): LogRichSegment {
  return { kind: 'entity', text, rarity };
}

function damageSegment(damage: number): LogRichSegment {
  return { kind: 'damage', text: String(damage) };
}

function healingSegment(amount: number): LogRichSegment {
  return { kind: 'healing', text: String(amount) };
}

function abilitySourceSegment(
  abilityId: AbilityId,
  attack?: number,
): LogRichSegment {
  return {
    kind: 'source',
    text: formatAbilityLabel(abilityId),
    source: {
      kind: 'ability',
      abilityId,
      attack,
    },
  };
}

function statusEffectSourceSegment(
  effectId: StatusEffectId,
  tone?: 'buff' | 'debuff',
  effect?: Pick<PlayerStatusEffect, 'value' | 'tickIntervalMs' | 'stacks'>,
): LogRichSegment {
  return {
    kind: 'source',
    text: formatStatusEffectLabel(effectId),
    source: {
      kind: 'statusEffect',
      effectId,
      tone,
      value: effect?.value,
      tickIntervalMs: effect?.tickIntervalMs,
      stacks: effect?.stacks,
    },
  };
}

function combatEntityName(enemy: Enemy) {
  return entitySegment(enemy.name, enemy.rarity ?? 'common');
}

function playerDamageRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
  attack?: number,
) {
  const source = abilitySourceSegment(abilityId, attack);

  switch (damageResolution.outcome) {
    case 'dodged':
      return [
        combatEntityName(enemy),
        textSegment(' dodges '),
        source,
        textSegment('.'),
      ];
    case 'suppressed':
      return [
        combatEntityName(enemy),
        textSegment(' takes '),
        damageSegment(damageResolution.damage),
        textSegment(' after suppressing '),
        source,
        textSegment('.'),
      ];
    case 'absorbed':
      return [
        combatEntityName(enemy),
        textSegment(' fully absorbs '),
        source,
        textSegment('.'),
      ];
    default:
      return [
        textSegment('You deal '),
        damageSegment(damageResolution.damage),
        textSegment(' to '),
        combatEntityName(enemy),
        textSegment(' with '),
        source,
        textSegment('.'),
      ];
  }
}

function enemyDamageRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  damageResolution: DamageResolution,
  attack?: number,
) {
  const source = abilitySourceSegment(abilityId, attack);

  switch (damageResolution.outcome) {
    case 'dodged':
      return [
        textSegment('You dodge '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'blocked':
      return [
        textSegment('You block '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    case 'suppressed':
      return [
        combatEntityName(enemy),
        textSegment(' deals '),
        damageSegment(damageResolution.damage),
        textSegment(' to you with '),
        source,
        textSegment(' after suppression.'),
      ];
    case 'absorbed':
      return [
        textSegment('You fully absorb '),
        source,
        textSegment(' from '),
        combatEntityName(enemy),
        textSegment('.'),
      ];
    default:
      return [
        combatEntityName(enemy),
        textSegment(' deals '),
        damageSegment(damageResolution.damage),
        textSegment(' to you with '),
        source,
        textSegment('.'),
      ];
  }
}

function playerHealRichText(
  abilityId: AbilityId,
  amount: number,
  attack?: number,
) {
  return [
    textSegment('You restore '),
    healingSegment(amount),
    textSegment(' with '),
    abilitySourceSegment(abilityId, attack),
    textSegment('.'),
  ];
}

function enemyHealRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  amount: number,
  attack?: number,
) {
  return [
    combatEntityName(enemy),
    textSegment(' restores '),
    healingSegment(amount),
    textSegment(' with '),
    abilitySourceSegment(abilityId, attack),
    textSegment('.'),
  ];
}

function playerStatusRichText(
  enemy: Enemy | undefined,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  const effect = statusEffectSourceSegment(effectId);

  return enemy
    ? [
        textSegment('You apply '),
        effect,
        textSegment(' to '),
        combatEntityName(enemy),
        textSegment(' with '),
        abilitySourceSegment(abilityId),
        textSegment('.'),
      ]
    : [
        textSegment('You apply '),
        effect,
        textSegment(' with '),
        abilitySourceSegment(abilityId),
        textSegment('.'),
      ];
}

function enemyStatusRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return [
    combatEntityName(enemy),
    textSegment(' afflicts you with '),
    statusEffectSourceSegment(effectId),
    textSegment(' using '),
    abilitySourceSegment(abilityId),
    textSegment('.'),
  ];
}

function enemyDebuffSuppressedRichText(
  enemy: Enemy,
  abilityId: AbilityId,
  effectId: StatusEffectId,
) {
  return [
    textSegment('You shrug off '),
    statusEffectSourceSegment(effectId),
    textSegment(' from '),
    abilitySourceSegment(abilityId),
    textSegment(' used by '),
    combatEntityName(enemy),
    textSegment('.'),
  ];
}

function enemyDefeatedRichText(enemy: Enemy) {
  return [
    textSegment('You defeated '),
    combatEntityName(enemy),
    textSegment('.'),
  ];
}

function resolveProcCount(state: GameState, seedKey: string, chance: number) {
  if (chance <= 0) return 0;

  const guaranteed = Math.floor(chance / 100);
  const remainder = chance - guaranteed * 100;
  if (remainder <= 0) return guaranteed;

  const roll = createRng(
    `${state.seed}:combat-proc:${seedKey}:${state.worldTimeMs}:${state.logSequence}:${state.turn}`,
  )();
  return guaranteed + (roll < remainder / 100 ? 1 : 0);
}

function processEnemyStatusEffects(state: GameState) {
  let changed = false;

  for (const enemyId of state.combat?.enemyIds ?? []) {
    const enemy = state.enemies[enemyId];
    if (!enemy?.statusEffects || enemy.statusEffects.length === 0) continue;

    const nextEffects = [];
    for (const effect of enemy.statusEffects) {
      const lastProcessedAt = effect.lastProcessedAt ?? state.worldTimeMs;
      const effectEndAt = effect.expiresAt ?? lastProcessedAt;
      const effectiveNow = Math.min(state.worldTimeMs, effectEndAt);
      const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
      const tickCount = Math.floor(
        Math.max(0, effectiveNow - lastProcessedAt) / tickIntervalMs,
      );

      if (tickCount > 0) {
        const stacks = Math.max(1, effect.stacks ?? 1);
        const damagePerTick =
          effect.id === StatusEffectTypeId.Poison
            ? Math.max(1, Math.floor(enemy.maxHp * 0.01 * stacks))
            : effect.id === StatusEffectTypeId.Burning
              ? Math.max(1, Math.floor(effect.value ?? 0) * stacks)
              : effect.id === StatusEffectTypeId.Bleeding
                ? Math.max(1, Math.floor(effect.value ?? 0))
                : 0;
        const healPerTick =
          effect.id === StatusEffectTypeId.Restoration
            ? Math.max(1, Math.floor(enemy.maxHp * ((effect.value ?? 1) / 100)))
            : 0;
        if (damagePerTick > 0) {
          enemy.hp = Math.max(0, enemy.hp - damagePerTick * tickCount);
          changed = true;
        }
        if (healPerTick > 0) {
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + healPerTick * tickCount);
          changed = true;
        }
      }

      if (effect.expiresAt != null && state.worldTimeMs >= effect.expiresAt) {
        changed = true;
        continue;
      }

      const nextLastProcessedAt = lastProcessedAt + tickCount * tickIntervalMs;
      nextEffects.push({
        ...effect,
        lastProcessedAt: nextLastProcessedAt,
      });
    }

    enemy.statusEffects = nextEffects;
    if (enemy.hp <= 0) {
      handleEnemyDefeat(state, enemy);
      changed = true;
      if (!state.combat) {
        return true;
      }
    }
  }

  return changed;
}

function canActorCastAbility(
  actor: NonNullable<GameState['combat']>['player'],
  abilityId: AbilityId,
  now: number,
) {
  return (
    actor.globalCooldownEndsAt <= now &&
    (actor.cooldownEndsAt[abilityId] ?? 0) <= now
  );
}

function getNextActorReadyAt(
  actor: NonNullable<GameState['combat']>['player'],
  worldTimeMs: number,
) {
  if (actor.casting) return undefined;

  return actor.abilityIds.reduce((soonest, abilityId) => {
    const readyAt = Math.max(
      actor.globalCooldownEndsAt,
      actor.cooldownEndsAt[abilityId] ?? worldTimeMs,
    );
    return Math.min(soonest, readyAt);
  }, Number.POSITIVE_INFINITY);
}

function getNextCombatStatusEffectEventAt(
  statusEffects: PlayerStatusEffect[] | undefined,
  worldTimeMs: number,
) {
  if (!statusEffects?.length) return undefined;

  return statusEffects.reduce<number | undefined>((soonest, effect) => {
    const nextEventAt = getNextStatusEffectEventAt(effect, worldTimeMs);
    if (nextEventAt == null) {
      return soonest;
    }

    if (soonest == null) {
      return nextEventAt;
    }

    return Math.min(soonest, nextEventAt);
  }, undefined);
}

function getNextStatusEffectEventAt(
  effect: PlayerStatusEffect,
  worldTimeMs: number,
) {
  const eventTimes: number[] = [];
  const lastProcessedAt = effect.lastProcessedAt ?? worldTimeMs;

  if (isTickingCombatStatusEffect(effect.id)) {
    const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
    const nextTickAt = lastProcessedAt + tickIntervalMs;
    if (effect.expiresAt == null || nextTickAt <= effect.expiresAt) {
      eventTimes.push(nextTickAt);
    }
  }

  if (effect.expiresAt != null) {
    eventTimes.push(effect.expiresAt);
  }

  if (eventTimes.length === 0) {
    return undefined;
  }

  return Math.max(worldTimeMs, Math.min(...eventTimes));
}

function isTickingCombatStatusEffect(statusEffectId: StatusEffectId) {
  return (
    statusEffectId === StatusEffectTypeId.Bleeding ||
    statusEffectId === StatusEffectTypeId.Burning ||
    statusEffectId === StatusEffectTypeId.Poison ||
    statusEffectId === StatusEffectTypeId.Restoration
  );
}

function selectEnemyGroupTarget(state: GameState) {
  return (
    state.combat?.enemyIds.find((enemyId) => Boolean(state.enemies[enemyId])) ??
    null
  );
}

function selectPlayerGroupTarget(state: GameState) {
  return state.player.hp > 0 ? 'player' : null;
}

function selectAbilityTargetId(
  state: GameState,
  casterId: 'player' | string,
  abilityId: AbilityId,
) {
  const ability = getAbilityDefinition(abilityId);
  if (casterId === 'player') {
    switch (ability.target) {
      case 'enemy':
        return selectEnemyGroupTarget(state);
      case 'randomEnemy':
        return pickRandomEnemyTarget(state, abilityId);
      case 'allEnemies':
        return selectEnemyGroupTarget(state);
      default:
        return 'player';
    }
  }

  switch (ability.target) {
    case 'self':
      return casterId;
    case 'injuredAlly':
    case 'randomAlly':
      return pickEnemyAllyTarget(state, casterId, abilityId, true);
    case 'allAllies':
      return casterId;
    case 'enemy':
    case 'randomEnemy':
    case 'allEnemies':
      return selectPlayerGroupTarget(state);
    default:
      return casterId;
  }
}

function pickRandomEnemyTarget(state: GameState, seedSuffix: string) {
  const enemyIds = state.combat?.enemyIds.filter((enemyId) =>
    Boolean(state.enemies[enemyId]),
  );
  if (!enemyIds || enemyIds.length === 0) return null;
  const rng = createRng(
    `${state.seed}:combat:player-target:${seedSuffix}:${state.worldTimeMs}`,
  );
  return enemyIds[Math.floor(rng() * enemyIds.length)] ?? enemyIds[0] ?? null;
}

function pickEnemyAllyTarget(
  state: GameState,
  casterId: string,
  seedSuffix: string,
  preferInjured: boolean,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) =>
      Boolean(state.enemies[enemyId]),
    ) ?? [];
  const allies = enemyIds
    .map((enemyId) => state.enemies[enemyId]!)
    .filter((enemy) => !preferInjured || enemy.hp < enemy.maxHp);
  if (allies.length === 0) {
    return enemyIds.includes(casterId) ? casterId : (enemyIds[0] ?? null);
  }
  const rng = createRng(
    `${state.seed}:combat:enemy-target:${casterId}:${seedSuffix}:${state.worldTimeMs}`,
  );
  return allies[Math.floor(rng() * allies.length)]?.id ?? casterId;
}

function resolveEnemyTargetsForEnemyAbility(
  state: GameState,
  casterId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) =>
      Boolean(state.enemies[enemyId]),
    ) ?? [];

  switch (ability.target) {
    case 'self':
      return state.enemies[casterId] ? [state.enemies[casterId]!] : [];
    case 'injuredAlly':
    case 'randomAlly': {
      const targetId = pickEnemyAllyTarget(
        state,
        casterId,
        ability.id,
        ability.target === 'injuredAlly',
      );
      const target = targetId ? state.enemies[targetId] : null;
      return target ? [target] : [];
    }
    case 'allAllies':
      return enemyIds.map((enemyId) => state.enemies[enemyId]!).filter(Boolean);
    default:
      return [];
  }
}

function canEnemyUseAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
  target: ReturnType<typeof getAbilityDefinition>['target'],
) {
  const enemy = state.enemies[enemyId];
  if (!enemy) return false;
  if (getEnemyMana(enemy) < getAbilityDefinition(abilityId).manaCost) {
    return false;
  }

  if (target === 'injuredAlly') {
    return resolveEnemyTargetsForEnemyAbility(
      state,
      enemyId,
      getAbilityDefinition(abilityId),
    ).some((ally) => ally.hp < ally.maxHp);
  }

  if (
    target === 'self' &&
    getAbilityDefinition(abilityId).effects.some(
      (effect) => effect.kind === 'heal',
    )
  ) {
    return enemy.hp < enemy.maxHp;
  }

  return true;
}

function applyEnemyAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
) {
  if (!state.combat) return;

  const enemy = state.enemies[enemyId];
  if (!enemy) return;

  const ability = getAbilityDefinition(abilityId);
  const playerStats = getPlayerStats(state.player);
  for (const effect of ability.effects) {
    if (effect.kind === 'damage') {
      const critCount = resolveProcCount(
        state,
        `enemy:${enemy.id}:${abilityId}:crit`,
        getEnemyCriticalStrikeChance(enemy),
      );
      const critMultiplier = Math.pow(
        Math.max(1, getEnemyCriticalStrikeDamage(enemy) / 100),
        Math.max(0, critCount),
      );
      const damageResolution = resolveIncomingDamage(
        state,
        `enemy:${enemy.id}:${abilityId}:player`,
        (() => {
          const baseDamage = Math.max(
            0,
            Math.round(
              getEnemyCombatAttack(enemy) * effect.powerMultiplier +
                (effect.flatPower ?? 0),
            ),
          );
          if (baseDamage <= 0) return 0;

          return Math.max(
            0,
            Math.round(
              Math.max(0, baseDamage - playerStats.defense) * critMultiplier,
            ),
          );
        })(),
        playerStats,
      );
      if (damageResolution.damage > 0) {
        state.player.hp = Math.max(
          0,
          state.player.hp - damageResolution.damage,
        );
      }
      const debuffApplication =
        damageResolution.outcome === 'dodged' ||
        damageResolution.outcome === 'blocked' ||
        damageResolution.outcome === 'absorbed'
          ? ('none' satisfies PlayerDebuffApplicationResult)
          : maybeApplyConfiguredStatusToPlayer(
              state,
              effect,
              getEnemyCombatAttack(enemy),
              abilityId,
              enemy.id,
            );
      addLog(
        state,
        'combat',
        formatEnemyDamageLog(enemy.name, ability.id, damageResolution),
        enemyDamageRichText(
          enemy,
          ability.id,
          damageResolution,
          getEnemyCombatAttack(enemy),
        ),
      );
      if (debuffApplication === 'suppressed' && effect.statusEffectId) {
        addLog(
          state,
          'combat',
          formatSuppressedEnemyDebuffLog(
            enemy.name,
            ability.id,
            effect.statusEffectId,
          ),
          enemyDebuffSuppressedRichText(
            enemy,
            ability.id,
            effect.statusEffectId,
          ),
        );
      }
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healEnemyTargets(state, enemyId, ability, effect);
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.enemyAbilityHeal', {
            ability: formatAbilityLabel(ability.id),
            enemy: enemy.name,
            amount: healed,
          }),
          enemyHealRichText(
            enemy,
            ability.id,
            healed,
            getEnemyCombatAttack(enemy),
          ),
        );
      }
      continue;
    }

    const statusApplication = applyEnemyStatusTargets(
      state,
      enemyId,
      ability,
      effect,
    );
    if (statusApplication.applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.enemyAbilityStatus', {
          ability: formatAbilityLabel(ability.id),
          enemy: enemy.name,
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
        enemyStatusRichText(enemy, ability.id, effect.statusEffectId),
      );
    }
    if (statusApplication.suppressed > 0) {
      addLog(
        state,
        'combat',
        formatSuppressedEnemyDebuffLog(
          enemy.name,
          ability.id,
          effect.statusEffectId,
        ),
        enemyDebuffSuppressedRichText(enemy, ability.id, effect.statusEffectId),
      );
    }
  }

  if (state.player.hp <= 0) {
    respawnAtNearestTown(state, state.combat.coord);
  }
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

export function craftRecipe(
  state: GameState,
  recipeId: string,
  count: number | 'max' = 1,
): GameState {
  if (state.gameOver) return state;
  const craftLimit =
    count === 'max' ? Number.POSITIVE_INFINITY : Math.max(1, count);
  let next = state;
  let crafted = 0;

  while (crafted < craftLimit) {
    const result = craftRecipeOnce(next, recipeId);
    if (!result.ok) {
      return crafted > 0 ? next : message(state, result.error);
    }

    next = result.state;
    crafted += 1;
  }

  return next;
}

function craftRecipeOnce(
  state: GameState,
  recipeId: string,
): { ok: true; state: GameState } | { ok: false; error: string } {
  const recipe = RECIPE_BOOK_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return { ok: false, error: t('game.message.recipe.notInBook') };
  if (!state.player.learnedRecipeIds.includes(recipe.id)) {
    return { ok: false, error: t('game.message.recipe.notLearned') };
  }
  const requiredStructure = getRecipeRequiredStructure(recipe);
  const requiredLabel =
    getStructureConfig(requiredStructure).title.toLowerCase();
  const recipeAction =
    recipe.skill === Skill.Cooking
      ? 'cook'
      : recipe.skill === Skill.Smelting
        ? 'smelt'
        : 'craft';
  if (getCurrentTile(state).structure !== requiredStructure) {
    return {
      ok: false,
      error: t('game.message.recipe.requiresStation', {
        station: requiredLabel,
        action: recipeAction,
      }),
    };
  }
  if (!hasAllRequirements(state.player.inventory, recipe.ingredients)) {
    return {
      ok: false,
      error: t('game.message.recipe.missingMaterials', {
        item: recipe.output.name,
      }),
    };
  }

  const chosenFuel = recipe.fuelOptions
    ? pickSatisfiedRequirement(state.player.inventory, recipe.fuelOptions)
    : undefined;
  if (recipe.fuelOptions && !chosenFuel) {
    return { ok: false, error: t('game.message.recipe.needsFuel') };
  }

  const next = cloneForPlayerMutation(state);
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
    recipe.skill === Skill.Cooking
      ? t('game.message.craft.cook', {
          item: recipe.output.name,
          fuel: chosenFuel
            ? ` ${t('ui.common.with')} ${describeRequirement(chosenFuel)}`
            : '',
        })
      : recipe.skill === Skill.Smelting
        ? t('game.message.craft.smelt', { item: recipe.output.name })
        : t('game.message.craft.make', { item: recipe.output.name }),
  );
  return { ok: true, state: next };
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
  const worldTimeMs = state.worldTimeMs;
  state.combat.enemies = Object.fromEntries(
    enemyIds.map((enemyId) => [
      enemyId,
      state.combat?.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  state.combat.enemyIds = enemyIds;
  if (enemyIds.length === 0) {
    state.combat = null;
    addLog(state, 'combat', t('game.message.combat.over'));
  }
}
