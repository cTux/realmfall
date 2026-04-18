import { hexDistance, hexKey, type HexCoord } from './hex';
import { t } from '../i18n';
import {
  formatEquipmentSlotLabel,
  formatSkillLabel,
  formatStatusEffectLabel,
} from '../i18n/labels';
import { Skill } from './types';
import {
  BLOOD_MOON_EXTRA_DROP_CHANCES,
  BLOOD_MOON_CHANCE,
  BLOOD_MOON_SPAWN_RADIUS,
  EARTHSHAKE_CHANCE,
  EARTHSHAKE_SPAWN_RADIUS,
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_RECIPE_DROP_CHANCES,
  GATHERING_BYPRODUCT_CHANCES,
  HARVEST_MOON_CHANCE,
  HARVEST_MOON_RESOURCE_CHANCES,
  HARVEST_MOON_SPAWN_RADIUS,
  HOME_SCROLL_DROP_CHANCES,
  HOME_SCROLL_ITEM_NAME_KEY,
  STARTING_RECIPE_IDS,
  WORLD_RADIUS,
  pickBloodMoonItemKind,
  pickBloodMoonSpawnChance,
  pickHarvestMoonResourceType,
  pickHarvestMoonSpawnChance,
} from './config';
import { createRng } from './random';
import { getAbilityDefinition } from './abilities';
import { itemName } from './content/i18n';
import { getEnemyConfig, isAnimalEnemyType } from './content/enemies';
import {
  buildItemFromConfig,
  getItemConfig,
  getItemConfigByKey,
  hasItemTag,
  itemOccupiesOffhand,
} from './content/items';
import { EquipmentSlotId, ItemId, StatusEffectTypeId } from './content/ids';
import { getStructureConfig } from './content/structures';
import {
  createCombatActorState,
  enemyRarityIndex,
  enemyKey,
  isAnimalEnemy,
  makeEnemy,
  nextEnemySpawnIndex,
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
import { buildTownStock } from './economy';
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
  compareItems,
  consolidateInventory,
  consumeInventoryItem,
  describeItemStack,
  getGoldAmount,
  makeHomeScroll,
  isEquippableItem,
  isRecipePage,
  makeConsumable,
  makeGoldStack,
  makeRecipePage,
  makeResourceStack,
  makeStarterArmor,
  makeStarterWeapon,
  materializeRecipeOutput,
  prospectYield,
  sellValue,
  spendGold,
} from './inventory';
import { GAME_TAGS } from './content/tags';
import {
  gatheringBonusChance,
  gatheringYieldBonus,
  gainSkillXp,
  gainXp,
  getPlayerStats,
  makeStartingSkills,
  rollGatheringBonus,
  skillLevelThreshold,
} from './progression';
import { isPassable, noise } from './shared';
import { isPlayerClaim, makePlayerClaim } from './territories';
import {
  buildTile,
  cacheSafeStart,
  describeStructure,
  ensureTileState,
  isGatheringStructure,
  makeArmor,
  makeArtifact,
  makeOffhand,
  makeWeapon,
  normalizeStructureState,
  structureActionLabel,
  structureDefinition,
} from './world';
import { copyGameState } from './stateClone';
import {
  getCurrentTile,
  getEnemiesAt,
  getEnemyAt,
  getHostileEnemyIds,
  getPlayerClaimedTiles,
  getTileAt,
  getVisibleTiles,
} from './stateWorldQueries';
import { getCurrentHexClaimStatus } from './stateClaims';
import { getSafePathToTile } from './statePathfinding';
import { isWorldBossFootprintOccupied } from './stateWorldBoss';
import {
  applySurvivalDecay,
  processPlayerStatusEffects,
  respawnAtNearestTown,
  teleportHome,
} from './stateSurvival';

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
export { EQUIPMENT_SLOTS, RARITY_ORDER } from './types';
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

export function createGame(
  radius = WORLD_RADIUS,
  seed = `world-${Date.now()}`,
): GameState {
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
      hp: 30,
      baseMaxHp: 30,
      mana: 12,
      baseMaxMana: 12,
      hunger: 100,
      thirst: 100,
      baseAttack: 4,
      baseDefense: 1,
      skills: makeStartingSkills(),
      learnedRecipeIds: [...STARTING_RECIPE_IDS],
      statusEffects: [],
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
    next.combat = createCombatState(next, target, hostileEnemyIds, next.worldTimeMs);
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

export function setHomeHex(
  state: GameState,
  coord: HexCoord = state.player.coord,
) {
  const targetTile = getTileAt(state, coord);
  if (targetTile.claim && !isPlayerClaim(targetTile.claim)) {
    return message(state, t('game.message.home.blockedByTerritory'));
  }

  const next = cloneForHomeMutation(state);
  next.homeHex = { ...coord };

  const key = hexKey(coord);
  const existingTile = next.tiles[key] ?? buildTile(next.seed, coord);
  existingTile.enemyIds.forEach((enemyId) => {
    delete next.enemies[enemyId];
  });
  next.tiles[key] = sanitizeHomeTile(existingTile);

  if (next.combat?.coord.q === coord.q && next.combat.coord.r === coord.r) {
    next.combat = null;
  }

  addLog(
    next,
    'system',
    t('game.message.home.set', { q: coord.q, r: coord.r }),
  );
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

export function equipItem(state: GameState, itemId: string): GameState {
  if (state.gameOver) return state;

  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const item = state.player.inventory[itemIndex];
  const next = cloneForPlayerMutation(state);

  if (canUseItem(item) && !isRecipePage(item)) {
    consumeItem(next, itemIndex, item);
    return next;
  }

  if (hasItemTag(item, GAME_TAGS.item.resource))
    return message(
      state,
      t('game.message.equipment.resourcesCannotBeEquipped'),
    );

  next.player.inventory.splice(itemIndex, 1);
  if (!item.slot)
    return message(state, t('game.message.equipment.cannotEquip'));

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

  const next =
    item.itemKey === ItemId.HomeScroll
      ? cloneForPlayerCombatMutation(state)
      : cloneForPlayerMutation(state);
  if (item.itemKey === ItemId.HomeScroll) {
    teleportHome(next, itemIndex, item);
    return next;
  }
  consumeItem(next, itemIndex, item);
  return next;
}

export function getCombatAutomationDelay(
  combat: GameState['combat'],
  worldTimeMs: number,
) {
  if (!combat || combat.enemyIds.length === 0) return null;

  const eventTimes = [
    combat.player.casting?.endsAt,
    getNextActorReadyAt(combat.player, worldTimeMs),
    ...combat.enemyIds.flatMap((enemyId) => {
      const actor = combat.enemies[enemyId];
      if (!actor) return [] as Array<number | undefined>;

      return [actor.casting?.endsAt, getNextActorReadyAt(actor, worldTimeMs)];
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
        createCombatActorState(
          worldTimeMs,
          state.enemies[enemyId]?.abilityIds,
        ),
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

    startAbilityCast(
      actor,
      abilityId,
      targetId,
      now,
      getEnemyAttackSpeed(enemyId, state),
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

function getEnemyAttackSpeed(enemyId: string, state: GameState) {
  const enemy = state.enemies[enemyId];
  if (!enemy?.statusEffects?.length) return 1;

  return Math.max(
    0.25,
    1 +
      getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Frenzy, 20) /
        100 -
      getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Chilling, 20) /
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
  const enemyTargets = resolveEnemyTargetsForPlayerAbility(state, ability, targetId);
  let totalDamage = 0;

  for (const effect of ability.effects) {
    if (effect.kind === 'damage') {
      for (const enemy of enemyTargets) {
        if (enemy.hp <= 0) continue;
        const damage = dealPlayerDamageToEnemy(state, abilityId, enemy, effect, playerStats);
        totalDamage += damage;
      }
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healPlayerTargets(state, ability, effect, playerStats.attack);
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.playerAbilityHeal', {
            ability: ability.name,
            amount: healed,
          }),
        );
      }
      continue;
    }

    const applied = applyPlayerStatusTargets(state, ability, effect);
    if (applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.playerAbilityStatus', {
          ability: ability.name,
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
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

  if (totalDamage <= 0 && abilityId === 'kick' && enemyTargets[0]) {
    addLog(
      state,
      'combat',
      t('game.message.combat.playerKick', {
        enemy: enemyTargets[0].name,
        damage: 0,
      }),
    );
  }
}

function applyPlayerOnHitEffects(
  state: GameState,
  enemy: NonNullable<GameState['enemies'][string]>,
  damage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
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

  const procCount = resolveProcCount(state, 'player:lifesteal', lifestealChance);
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
  const procCount = resolveProcCount(state, `enemy:${enemy.id}:${effectId}`, chance);
  if (procCount <= 0) return;

  const suppressChance = 0;
  if (
    suppressChance > 0 &&
    resolveProcCount(state, `enemy:${enemy.id}:suppress:${effectId}`, suppressChance) >
      0
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
    stacks:
      effectId === 'poison' || effectId === 'burning'
        ? procCount
        : 1,
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
    id: effectId === 'power' ? StatusEffectTypeId.Power : StatusEffectTypeId.Frenzy,
    value: effectId === 'power' ? 10 : 20,
    expiresAt: state.worldTimeMs + 10_000,
    tickIntervalMs: Math.max(1, Math.round(2_000 / Math.max(0.01, attackSpeed))),
    stacks: 1,
  });
}

function dealPlayerDamageToEnemy(
  state: GameState,
  abilityId: AbilityId,
  enemy: NonNullable<GameState['enemies'][string]>,
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'damage' }>,
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
    1,
    Math.round(playerStats.attack * effect.powerMultiplier + (effect.flatPower ?? 0)),
  );
  const damage = Math.max(
    1,
    Math.round(
      Math.max(1, baseDamage - getEnemyEffectiveDefense(enemy)) * critMultiplier,
    ),
  );
  enemy.hp = Math.max(0, enemy.hp - damage);
  applyPlayerOnHitEffects(state, enemy, damage, playerStats);
  maybeApplyConfiguredStatusToEnemy(state, enemy, effect, playerStats.attack);
  addLog(
    state,
    'combat',
    t(
      abilityId === 'kick'
        ? 'game.message.combat.playerKick'
        : 'game.message.combat.playerAbilityDamage',
      {
        ability: getAbilityDefinition(abilityId).name,
        enemy: enemy.name,
        damage,
      },
    ),
  );
  return damage;
}

function healPlayerTargets(
  state: GameState,
  ability: ReturnType<typeof getAbilityDefinition>,
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'heal' }>,
  power: number,
) {
  const targets =
    ability.target === 'allAllies'
      ? [state.player]
      : [state.player];
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
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'applyStatus' }>,
) {
  if (ability.target === 'allEnemies' || ability.target === 'enemy' || ability.target === 'randomEnemy') {
    return resolveEnemyTargetsForPlayerAbility(state, ability, selectEnemyGroupTarget(state) ?? '').reduce(
      (count, enemy) =>
        count +
        (applyStatusEffectToEnemy(state, enemy, {
          id: effect.statusEffectId,
          value: effect.value,
          expiresAt: effect.permanent ? undefined : state.worldTimeMs + (effect.durationMs ?? 0),
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
    expiresAt: effect.permanent ? undefined : state.worldTimeMs + (effect.durationMs ?? 0),
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
  maybeDropEnemyGold(state, enemy);
  maybeDropEnemyConsumables(state, enemy);
  maybeDropEnemyRecipe(state, enemy);
  maybeDropHomeScroll(state, enemy);
  maybeDropBloodMoonLoot(state, enemy);
  maybeSkinEnemy(state, enemy);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyDefeated', { enemy: enemy.name }),
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
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'heal' }>,
) {
  const targets = resolveEnemyTargetsForEnemyAbility(state, enemyId, ability);
  const total = targets.reduce((sum, enemy) => {
    const amount = Math.max(
      1,
      Math.round(
        (getEnemyEffectiveAttack(state.enemies[enemyId]!) * effect.powerMultiplier +
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
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'applyStatus' }>,
) {
  if (ability.target === 'allAllies' || ability.target === 'randomAlly' || ability.target === 'injuredAlly' || ability.target === 'self') {
    return resolveEnemyTargetsForEnemyAbility(state, enemyId, ability).reduce(
      (count, enemy) =>
        count +
        (applyStatusEffectToEnemy(state, enemy, {
          id: effect.statusEffectId,
          value: effect.value,
          expiresAt: effect.permanent ? undefined : state.worldTimeMs + (effect.durationMs ?? 0),
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
    expiresAt: effect.permanent ? undefined : state.worldTimeMs + (effect.durationMs ?? 0),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  })
    ? 1
    : 0;
}

function maybeApplyConfiguredStatusToEnemy(
  state: GameState,
  enemy: Enemy,
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'damage' }>,
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
      Math.round(attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0)),
    ),
    expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  });
}

function maybeApplyConfiguredStatusToPlayer(
  state: GameState,
  effect: Extract<ReturnType<typeof getAbilityDefinition>['effects'][number], { kind: 'damage' }>,
  attackValue: number,
) {
  if (!effect.statusEffectId || !effect.statusChance) return;
  if (
    resolveProcCount(
      state,
      `player:${effect.statusEffectId}`,
      effect.statusChance,
    ) <= 0
  ) {
    return;
  }

  applyStatusEffectToPlayer(state, {
    id: effect.statusEffectId,
    value: Math.max(
      1,
      Math.round(attackValue * (effect.valueMultiplier ?? 0) + (effect.valueFlat ?? 0)),
    ),
    expiresAt: state.worldTimeMs + (effect.durationMs ?? 6_000),
    tickIntervalMs: effect.tickIntervalMs,
    stacks: effect.stacks ?? 1,
  });
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
      : nextEffect.stacks ?? 1;

  return {
    id: nextEffect.id,
    value: nextEffect.value,
    expiresAt: nextEffect.expiresAt,
    tickIntervalMs: nextEffect.tickIntervalMs,
    lastProcessedAt: state.worldTimeMs,
    stacks,
  };
}

function getEnemyEffectiveAttack(enemy: Enemy) {
  return Math.max(
    1,
    Math.round(
      enemy.attack *
        (1 + getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Power, 10) / 100) *
        (1 - getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Weakened, 15) / 100),
    ),
  );
}

function getEnemyEffectiveDefense(enemy: Enemy) {
  return Math.max(
    0,
    Math.round(
      enemy.defense *
        (1 + getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Guard, 15) / 100) *
        (1 - getCombatStatusValue(enemy.statusEffects, StatusEffectTypeId.Shocked, 15) / 100),
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
      effect.id === effectId ? Math.max(highest, effect.value ?? fallback) : highest,
    0,
  );
}

function resolveIncomingDamage(
  state: GameState,
  seedKey: string,
  incomingDamage: number,
  playerStats: ReturnType<typeof getPlayerStats>,
) {
  if (
    resolveProcCount(state, `${seedKey}:dodge`, playerStats.dodgeChance ?? 0) > 0
  ) {
    return 0;
  }
  if (
    resolveProcCount(state, `${seedKey}:block`, playerStats.blockChance ?? 0) > 0
  ) {
    return 0;
  }
  if (
    resolveProcCount(
      state,
      `${seedKey}:suppress`,
      playerStats.suppressDamageChance ?? 0,
    ) > 0
  ) {
    const suppressedDamage = Math.round(
      incomingDamage *
        (1 - Math.min(95, playerStats.suppressDamageReduction ?? 0) / 100),
    );
    return Math.max(1, suppressedDamage);
  }

  return incomingDamage;
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
            ? Math.max(
                1,
                Math.floor(enemy.maxHp * ((effect.value ?? 1) / 100)),
              )
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
  const rng = createRng(`${state.seed}:combat:player-target:${seedSuffix}:${state.worldTimeMs}`);
  return enemyIds[Math.floor(rng() * enemyIds.length)] ?? enemyIds[0] ?? null;
}

function pickEnemyAllyTarget(
  state: GameState,
  casterId: string,
  seedSuffix: string,
  preferInjured: boolean,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) => Boolean(state.enemies[enemyId])) ?? [];
  const allies = enemyIds
    .map((enemyId) => state.enemies[enemyId]!)
    .filter((enemy) => !preferInjured || enemy.hp < enemy.maxHp);
  if (allies.length === 0) {
    return enemyIds.includes(casterId) ? casterId : enemyIds[0] ?? null;
  }
  const rng = createRng(`${state.seed}:combat:enemy-target:${casterId}:${seedSuffix}:${state.worldTimeMs}`);
  return allies[Math.floor(rng() * allies.length)]?.id ?? casterId;
}

function resolveEnemyTargetsForEnemyAbility(
  state: GameState,
  casterId: string,
  ability: ReturnType<typeof getAbilityDefinition>,
) {
  const enemyIds =
    state.combat?.enemyIds.filter((enemyId) => Boolean(state.enemies[enemyId])) ?? [];

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

  if (target === 'injuredAlly') {
    return resolveEnemyTargetsForEnemyAbility(state, enemyId, getAbilityDefinition(abilityId)).some(
      (ally) => ally.hp < ally.maxHp,
    );
  }

  if (
    target === 'self' &&
    getAbilityDefinition(abilityId).effects.some((effect) => effect.kind === 'heal')
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
      const damage = resolveIncomingDamage(
        state,
        `enemy:${enemy.id}:${abilityId}:player`,
        Math.max(
          1,
          Math.round(
            getEnemyEffectiveAttack(enemy) * effect.powerMultiplier +
              (effect.flatPower ?? 0) -
              playerStats.defense,
          ),
        ),
        playerStats,
      );
      if (damage > 0) {
        state.player.hp = Math.max(0, state.player.hp - damage);
      }
      maybeApplyConfiguredStatusToPlayer(
        state,
        effect,
        getEnemyEffectiveAttack(enemy),
      );
      addLog(
        state,
        'combat',
        t(
          abilityId === 'kick'
            ? 'game.message.combat.enemyKick'
            : 'game.message.combat.enemyAbilityDamage',
          {
            ability: ability.name,
            enemy: enemy.name,
            damage,
          },
        ),
      );
      continue;
    }

    if (effect.kind === 'heal') {
      const healed = healEnemyTargets(state, enemyId, ability, effect);
      if (healed > 0) {
        addLog(
          state,
          'combat',
          t('game.message.combat.enemyAbilityHeal', {
            ability: ability.name,
            enemy: enemy.name,
            amount: healed,
          }),
        );
      }
      continue;
    }

    const applied = applyEnemyStatusTargets(state, enemyId, ability, effect);
    if (applied > 0) {
      addLog(
        state,
        'combat',
        t('game.message.combat.enemyAbilityStatus', {
          ability: ability.name,
          enemy: enemy.name,
          effect: formatStatusEffectLabel(effect.statusEffectId),
        }),
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

export function isOffhandSlotDisabled(
  equipment: GameState['player']['equipment'],
) {
  return itemOccupiesOffhand(equipment.weapon);
}

export function sortInventory(state: GameState): GameState {
  const next = cloneForPlayerMutation(state);
  next.player.inventory = consolidateInventory(next.player.inventory);
  const equippable = next.player.inventory
    .filter(isEquippableItem)
    .sort(compareItems);
  const other = next.player.inventory.filter((item) => !isEquippableItem(item));
  next.player.inventory = [...equippable, ...other];
  addLog(next, 'system', t('game.message.inventory.sort'));
  return next;
}

export function sellAllItems(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'town') {
    return message(state, t('game.message.sell.townOnly'));
  }
  const sellable = state.player.inventory.filter(
    (item) => isEquippableItem(item) && !item.locked,
  );
  if (sellable.length === 0)
    return message(state, t('game.message.sell.empty'));

  const next = cloneForPlayerMutation(state);
  const gold = sellable.reduce((sum, item) => sum + sellValue(item), 0);
  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item) || item.locked,
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(next, 'system', t('game.message.sell.success', { gold }));
  return next;
}

export function sellInventoryItem(state: GameState, itemId: string): GameState {
  if (getCurrentTile(state).structure !== 'town') {
    return message(state, t('game.message.sell.townOnly'));
  }

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (
    !item ||
    (!isEquippableItem(item) && !isRecipePage(item)) ||
    item.locked
  ) {
    return message(state, t('game.message.sell.empty'));
  }

  const next = cloneForPlayerMutation(state);
  const gold = sellValue(item);
  next.player.inventory = next.player.inventory.filter(
    (entry) => entry.id !== itemId,
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(
    next,
    'system',
    t('game.message.sell.itemSuccess', {
      item: describeItemStack(item),
      gold,
    }),
  );
  return next;
}

export function prospectInventory(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, t('game.message.prospect.forgeOnly'));
  }

  const next = cloneForPlayerMutation(state);
  const prospectable = next.player.inventory.filter(
    (item) => isEquippableItem(item) && !item.locked,
  );
  if (prospectable.length === 0) {
    return message(state, t('game.message.prospect.empty'));
  }

  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item) || item.locked,
  );
  prospectable.forEach((item) => {
    prospectYield(item).forEach((resource) =>
      addItemToInventory(next.player.inventory, resource),
    );
  });

  next.player.inventory.sort(compareItems);
  addLog(next, 'loot', t('game.message.prospect.success'));
  return next;
}

export function prospectInventoryItem(
  state: GameState,
  itemId: string,
): GameState {
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, t('game.message.prospect.forgeOnly'));
  }

  const item = state.player.inventory.find((entry) => entry.id === itemId);
  if (!item || !isEquippableItem(item) || item.locked) {
    return message(state, t('game.message.prospect.empty'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  next.player.inventory = next.player.inventory.filter(
    (entry) => entry.id !== itemId,
  );
  prospectYield(item).forEach((resource) =>
    addItemToInventory(next.player.inventory, resource),
  );
  next.player.inventory.sort(compareItems);
  addLog(
    next,
    'loot',
    t('game.message.prospect.itemSuccess', {
      item: describeItemStack(item),
    }),
  );
  return next;
}

export function takeTileItem(state: GameState, itemId: string): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  const itemIndex = tile.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) return message(state, t('game.message.loot.itemGone'));

  const [item] = tile.items.splice(itemIndex, 1);
  addItemToInventory(next.player.inventory, item);
  next.tiles[key] = normalizeStructureState({
    ...tile,
    items: [...tile.items],
  });
  addLog(
    next,
    'loot',
    t('game.message.loot.takeOne', { item: describeItemStack(item) }),
  );
  return next;
}

export function claimCurrentHex(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const status = getCurrentHexClaimStatus(state);
  if (!status.canClaim) {
    return message(state, status.reason ?? t('game.message.claim.unavailable'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];

  if (status.action === 'unclaim') {
    tile.claim = undefined;
    next.tiles[key] = { ...tile };
    addLog(
      next,
      'system',
      t('game.message.claim.removed', {
        q: next.player.coord.q,
        r: next.player.coord.r,
      }),
    );
    return next;
  }

  consumeInventoryResource(next.player.inventory, 'cloth', 1);
  consumeInventoryResource(next.player.inventory, 'sticks', 1);
  tile.claim = makePlayerClaim();
  next.tiles[key] = { ...tile };

  addLog(
    next,
    'system',
    t('game.message.claim.success', {
      q: next.player.coord.q,
      r: next.player.coord.r,
    }),
  );
  return next;
}

export function interactWithStructure(state: GameState): GameState {
  if (state.gameOver) return state;
  if (state.combat) {
    return message(state, t('game.message.combat.finishCurrentBattleFirst'));
  }

  const tile = getCurrentTile(state);
  if (!isGatheringStructure(tile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }

  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const currentTile = next.tiles[key];
  if (!isGatheringStructure(currentTile.structure)) {
    return message(state, t('game.message.gather.nothingHere'));
  }

  next.turn += 1;
  applySurvivalDecay(next);

  if (next.player.hp <= 0) {
    respawnAtNearestTown(next, next.player.coord);
    return next;
  }

  const definition = structureDefinition(currentTile.structure);
  const skill = next.player.skills[definition.skill];
  const damage = Math.min(currentTile.structureHp ?? definition.maxHp, 1);
  const bonusLoot = rollGatheringBonus(next, definition.skill);
  const quantity =
    definition.baseYield + gatheringYieldBonus(skill.level) + bonusLoot;

  currentTile.structureHp = Math.max(
    0,
    (currentTile.structureHp ?? definition.maxHp) - damage,
  );
  const rewards = buildGatheringRewards(
    next,
    currentTile.structure,
    definition,
    quantity,
  );
  rewards.forEach((reward) =>
    addItemToInventory(next.player.inventory, reward),
  );
  const byproduct = maybeGatherByproduct(
    next,
    currentTile.structure,
    definition,
  );
  gainSkillXp(next, definition.skill, damage, addLog);

  addLog(
    next,
    'loot',
    t('game.message.gather.success', {
      action: definition.verb,
      item: describeItemStacks(rewards),
    }),
  );
  if (bonusLoot > 0) {
    addLog(
      next,
      'system',
      t('game.message.gather.bonus', {
        skill: formatSkillLabel(definition.skill),
        reward: definition.reward.toLocaleLowerCase(),
      }),
    );
  }

  if (byproduct) {
    addItemToInventory(next.player.inventory, byproduct.item);
    addLog(next, 'loot', byproduct.text);
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
    return message(state, t('game.message.buy.townOnly'));
  }

  const stock = buildTownStock(state.seed, tile.coord);
  const entry = stock.find((candidate) => candidate.item.id === itemId);
  if (!entry) return message(state, t('game.message.buy.unavailable'));

  const gold = getGoldAmount(state.player.inventory);
  if (gold < entry.price) {
    return message(
      state,
      t('game.message.buy.needsGold', {
        price: entry.price,
        item: entry.item.name,
      }),
    );
  }

  const next = cloneForPlayerMutation(state);
  spendGold(next.player.inventory, entry.price);
  addItemToInventory(next.player.inventory, { ...entry.item });
  addLog(
    next,
    'system',
    t('game.message.buy.success', {
      item: entry.item.name,
      price: entry.price,
    }),
  );
  return next;
}

export function takeAllTileItems(state: GameState): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  if (tile.items.length === 0)
    return message(state, t('game.message.loot.nothingHere'));

  tile.items.forEach((item) => addItemToInventory(next.player.inventory, item));
  next.tiles[key] = normalizeStructureState({ ...tile, items: [] });
  addLog(
    next,
    'loot',
    t('game.message.loot.takeMany', {
      items: tile.items.map((item) => describeItemStack(item)).join(', '),
    }),
  );
  return next;
}

export function dropInventoryItem(state: GameState, itemId: string): GameState {
  const next = cloneForPlayerAndTileMutation(state);
  const itemIndex = next.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));

  const [item] = next.player.inventory.splice(itemIndex, 1);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, item);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    next,
    'loot',
    t('game.message.loot.drop', { item: describeItemStack(item) }),
  );
  return next;
}

export function dropEquippedItem(
  state: GameState,
  slot: EquipmentSlot,
): GameState {
  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, t('game.message.equipment.slotEmpty'));

  const next = cloneForPlayerAndTileMutation(state);
  delete next.player.equipment[slot];
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];
  addItemToInventory(tile.items, equipped);
  next.tiles[key] = { ...tile, items: [...tile.items] };
  const maxHp = getPlayerStats(next.player).maxHp;
  next.player.hp = Math.min(maxHp, next.player.hp);
  addLog(next, 'loot', t('game.message.loot.drop', { item: equipped.name }));
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

export function setInventoryItemLocked(
  state: GameState,
  itemId: string,
  locked: boolean,
): GameState {
  const itemIndex = state.player.inventory.findIndex(
    (item) => item.id === itemId,
  );
  if (itemIndex < 0) return message(state, t('game.message.item.notInPack'));
  if (state.player.inventory[itemIndex]?.locked === locked) return state;

  const next = cloneForPlayerMutation(state);
  const item = next.player.inventory[itemIndex];
  if (!item) return state;
  item.locked = locked;
  addLog(
    next,
    'system',
    locked
      ? t('game.message.item.locked', { item: item.name })
      : t('game.message.item.unlocked', { item: item.name }),
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

function resolveConsumableUseEffects(state: GameState, item: Item) {
  const stats = getPlayerStats(state.player);
  const healing = Math.max(
    0,
    Math.min(
      stats.maxHp - state.player.hp,
      item.itemKey === ItemId.HealthPotion
        ? Math.max(1, Math.ceil(stats.maxHp * 0.1))
        : item.healing,
    ),
  );
  const mana = Math.max(
    0,
    Math.min(
      stats.maxMana - state.player.mana,
      item.itemKey === ItemId.ManaPotion
        ? Math.max(1, Math.ceil(stats.maxMana * 0.1))
        : 0,
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

function consumeInventoryResource(
  inventory: Item[],
  itemKey: 'cloth' | 'sticks',
  quantity: number,
) {
  let remaining = quantity;
  for (
    let index = inventory.length - 1;
    index >= 0 && remaining > 0;
    index -= 1
  ) {
    const item = inventory[index];
    if (
      !hasItemTag(item, GAME_TAGS.item.resource) ||
      item.itemKey !== itemKey
    ) {
      continue;
    }

    const spent = Math.min(item.quantity, remaining);
    item.quantity -= spent;
    remaining -= spent;
    if (item.quantity <= 0) {
      inventory.splice(index, 1);
    }
  }
}

function message(state: GameState, text: string): GameState {
  const next = copyGameState(state, { logs: true });
  addLog(next, 'system', text);
  return next;
}

function buildGatheringRewards(
  state: GameState,
  structure: import('./types').GatheringStructureType,
  definition: ReturnType<typeof structureDefinition>,
  quantity: number,
) {
  if (!definition.rewardTable || definition.rewardTable.length === 0) {
    return [
      makeResourceStack(
        definition.rewardItemKey,
        definition.rewardTier,
        quantity,
      ),
    ];
  }

  const counts = new Map<string, { tier: number; quantity: number }>();
  for (let index = 0; index < quantity; index += 1) {
    const reward = pickGatheringReward(state, structure, definition, index);
    const key = reward.itemKey;
    const current = counts.get(key) ?? {
      tier: reward.rewardTier ?? definition.rewardTier,
      quantity: 0,
    };
    counts.set(key, {
      tier: current.tier,
      quantity: current.quantity + (reward.quantity ?? 1),
    });
  }

  return [...counts.entries()].map(([itemKey, reward]) =>
    makeResourceStack(itemKey, reward.tier, reward.quantity),
  );
}

function pickGatheringReward(
  state: GameState,
  structure: import('./types').GatheringStructureType,
  definition: ReturnType<typeof structureDefinition>,
  rollIndex: number,
) {
  const table = definition.rewardTable;
  if (!table || table.length === 0) {
    return {
      itemKey: definition.rewardItemKey,
      rewardTier: definition.rewardTier,
      quantity: 1,
    };
  }

  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  const rng = createRng(
    `${state.seed}:gather-reward:${structure}:${state.turn}:${hexKey(state.player.coord)}:${rollIndex}`,
  );
  let remaining = rng() * totalWeight;
  for (const entry of table) {
    remaining -= entry.weight;
    if (remaining <= 0) return entry;
  }
  return table[table.length - 1]!;
}

function describeItemStacks(items: Item[]) {
  if (items.length === 1) return describeItemStack(items[0]!);
  return items.map(describeItemStack).join(', ');
}

function cloneForWorldMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
    player: true,
  });
}

function cloneForPlayerMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    player: true,
  });
}

function cloneForPlayerCombatMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    player: true,
  });
}

function cloneForPlayerAndTileMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    tiles: true,
    player: true,
  });
}

function cloneForWorldEventMutation(state: GameState) {
  return copyGameState(state, {
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
  });
}

function cloneForHomeMutation(state: GameState) {
  return copyGameState(state, {
    homeHex: true,
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
  });
}

function isHomeHex(state: GameState, coord: HexCoord) {
  return state.homeHex.q === coord.q && state.homeHex.r === coord.r;
}

function sanitizeHomeTile(tile: GameState['tiles'][string]) {
  return {
    ...tile,
    items: [],
    structure: undefined,
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
  };
}

function maybeGatherByproduct(
  state: GameState,
  structure: import('./types').GatheringStructureType,
  definition: ReturnType<typeof structureDefinition>,
) {
  const byproductItemKey =
    structure === 'tree'
      ? ItemId.Sticks
      : structure === 'copper-ore' ||
          structure === 'tin-ore' ||
          structure === 'iron-ore' ||
          structure === 'gold-ore' ||
          structure === 'platinum-ore' ||
          structure === 'coal-ore'
        ? ItemId.Stone
        : null;
  if (!byproductItemKey) return null;

  const rng = createRng(
    `${state.seed}:gather-byproduct:${structure}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  if (
    rng() >=
    (structure === 'tree'
      ? GATHERING_BYPRODUCT_CHANCES.tree
      : GATHERING_BYPRODUCT_CHANCES.ore)
  ) {
    return null;
  }

  return {
    item: makeResourceStack(byproductItemKey, definition.rewardTier, 1),
    text:
      structure === 'tree'
        ? t('game.message.gather.byproduct.sticks', {
            item: itemName(ItemId.Sticks),
          })
        : t('game.message.gather.byproduct.stone', {
            item: itemName(ItemId.Stone),
          }),
  };
}

function maybeDropEnemyGold(state: GameState, enemy: import('./types').Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
  const rarityRank = enemyRarityIndex(enemy.rarity);
  if (enemy.worldBoss) {
    const quantity = Math.max(40, enemy.tier * 12 + Math.floor(rng() * 40));
    ensureTileState(state, enemy.coord);
    const key = hexKey(enemy.coord);
    const tile = state.tiles[key];
    addItemToInventory(tile.items, makeGoldStack(quantity));
    state.tiles[key] = { ...tile, items: [...tile.items] };
    addLog(
      state,
      'loot',
      t('game.message.enemyDrop.gold', {
        enemy: enemy.name,
        amount: quantity,
      }),
    );
    return;
  }

  const chance = state.bloodMoonActive
    ? ENEMY_GOLD_DROP_CHANCES.bloodMoon
    : Math.min(
        ENEMY_GOLD_DROP_CHANCES.max,
        ENEMY_GOLD_DROP_CHANCES.base +
          enemy.tier * ENEMY_GOLD_DROP_CHANCES.perTier +
          rarityRank * ENEMY_GOLD_DROP_CHANCES.perRarity +
          (enemy.elite ? ENEMY_GOLD_DROP_CHANCES.eliteBonus : 0),
      );
  if (rng() > chance) return;

  const quantity = Math.max(
    1,
    Math.floor(enemy.tier + rarityRank + rng() * (5 + rarityRank * 2)),
  );
  const bloodMoonQuantity = state.bloodMoonActive
    ? Math.max(quantity + enemy.tier, Math.ceil(quantity * 2.5))
    : quantity;
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeGoldStack(bloodMoonQuantity));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.gold', {
      enemy: enemy.name,
      amount: bloodMoonQuantity,
    }),
  );
}

function maybeDropEnemyConsumables(
  state: GameState,
  enemy: import('./types').Enemy,
) {
  const dropKeys = [
    'apple',
    'water-flask',
    'health-potion',
    'mana-potion',
  ] as const;

  dropKeys.forEach((itemKey) => {
    const configured = getItemConfigByKey(itemKey);
    const chance = Math.min(
      0.92,
      (configured?.dropChance ?? 0) + enemyRarityIndex(enemy.rarity) * 0.04,
    );
    if (chance <= 0) return;

    const rng = createRng(
      `${state.seed}:enemy-consumable:${itemKey}:${enemy.id}:${state.turn}`,
    );
    if (rng() >= chance) return;

    ensureTileState(state, enemy.coord);
    const key = hexKey(enemy.coord);
    const tile = state.tiles[key];
    addItemToInventory(
      tile.items,
      buildItemFromConfig(itemKey, {
        id: `${itemKey}:${enemy.id}:${state.turn}`,
      }),
    );
    state.tiles[key] = { ...tile, items: [...tile.items] };
    addLog(
      state,
      'loot',
      t('game.message.enemyDrop.item', {
        enemy: enemy.name,
        item: configured?.name ?? itemKey,
      }),
    );
  });
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
  const rarityRank = enemyRarityIndex(enemy.rarity);
  const baseChance = Math.min(
    ENEMY_RECIPE_DROP_CHANCES.max,
    ENEMY_RECIPE_DROP_CHANCES.base +
      enemy.tier * ENEMY_RECIPE_DROP_CHANCES.perTier +
      rarityRank * ENEMY_RECIPE_DROP_CHANCES.perRarity,
  );
  const chance = state.bloodMoonActive
    ? Math.min(
        ENEMY_RECIPE_DROP_CHANCES.bloodMoonMax,
        baseChance + ENEMY_RECIPE_DROP_CHANCES.bloodMoonBonus,
      )
    : baseChance;
  if (rng() >= chance) return;

  const recipe = unlearnedRecipes[Math.floor(rng() * unlearnedRecipes.length)];
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeRecipePage(recipe));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.recipe', {
      enemy: enemy.name,
      recipe: recipe.name,
    }),
  );
}

function maybeDropHomeScroll(state: GameState, enemy: import('./types').Enemy) {
  const rng = createRng(
    `${state.seed}:enemy-home-scroll:${enemy.id}:${state.turn}`,
  );
  if (
    rng() >=
    Math.min(
      HOME_SCROLL_DROP_CHANCES.max,
      HOME_SCROLL_DROP_CHANCES.base +
        enemyRarityIndex(enemy.rarity) * HOME_SCROLL_DROP_CHANCES.perRarity,
    )
  ) {
    return;
  }

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(
    tile.items,
    makeHomeScroll(`home-scroll:${enemy.id}:${state.turn}`),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.item', {
      enemy: enemy.name,
      item: t(HOME_SCROLL_ITEM_NAME_KEY),
    }),
  );
}

function maybeDropBloodMoonLoot(
  state: GameState,
  enemy: import('./types').Enemy,
) {
  if (!state.bloodMoonActive && !enemy.worldBoss) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const rarityRank = enemyRarityIndex(enemy.rarity);
  const baseTier = Math.max(
    1,
    enemy.tier + Math.max(1, Math.floor(rarityRank / 2)),
  );
  const minimumRarity = enemy.worldBoss
    ? 'legendary'
    : rarityRank >= 2
      ? 'epic'
      : 'rare';
  addItemToInventory(
    tile.items,
    makeBloodMoonDrop(state, enemy, 0, baseTier, minimumRarity),
  );

  const rng = createRng(
    `${state.seed}:blood-moon-loot:${enemy.id}:${state.turn}`,
  );
  if (enemy.worldBoss) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(state, enemy, 1, baseTier + 1, 'legendary'),
    );
  } else if (
    rarityRank >= 2 ||
    rng() <
      BLOOD_MOON_EXTRA_DROP_CHANCES.base +
        rarityRank * BLOOD_MOON_EXTRA_DROP_CHANCES.perRarity
  ) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(state, enemy, 1, baseTier + 1, minimumRarity),
    );
  }

  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.bloodMoon', { enemy: enemy.name }),
  );
}

function maybeSkinEnemy(state: GameState, enemy: import('./types').Enemy) {
  if (!isAnimalEnemy(enemy)) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const quantity = Math.max(
    1,
    Math.ceil(enemy.tier / 2) + (state.bloodMoonActive ? 1 : 0),
  );
  addItemToInventory(
    tile.items,
    makeResourceStack(ItemId.LeatherScraps, enemy.tier, quantity),
  );
  addItemToInventory(
    tile.items,
    makeResourceStack('meat', enemy.tier, quantity),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  gainSkillXp(state, Skill.Skinning, quantity, addLog);
  addLog(
    state,
    'loot',
    t('game.message.skinning.success', {
      enemy: enemy.name,
      quantity,
      item: itemName('leather-scraps'),
    }),
  );
  addLog(
    state,
    'loot',
    t('game.message.skinning.meat', {
      enemy: enemy.name,
      quantity,
      item: itemName('meat'),
    }),
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
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const key = hexKey(coord);
      const tile = state.tiles[key];
      if (!canSpawnBloodMoonEnemiesOnTile(state, tile)) continue;

      const rng = createRng(
        `${state.seed}:blood-moon-spawn:${state.bloodMoonCycle}:${key}`,
      );
      const spawnChance = pickBloodMoonSpawnChance(distance);
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

function spawnHarvestMoonResources(state: GameState) {
  let spawned = 0;

  for (
    let dq = -HARVEST_MOON_SPAWN_RADIUS;
    dq <= HARVEST_MOON_SPAWN_RADIUS;
    dq += 1
  ) {
    for (
      let dr = -HARVEST_MOON_SPAWN_RADIUS;
      dr <= HARVEST_MOON_SPAWN_RADIUS;
      dr += 1
    ) {
      const coord = {
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > HARVEST_MOON_SPAWN_RADIUS) continue;
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const key = hexKey(coord);
      const tile = state.tiles[key];
      if (!canSpawnHarvestMoonResourceOnTile(state, tile)) continue;

      const rng = createRng(
        `${state.seed}:harvest-moon-spawn:${state.harvestMoonCycle}:${key}`,
      );
      if (rng() >= pickHarvestMoonSpawnChance(distance)) continue;

      const structure = pickHarvestMoonResourceType(rng());
      const definition = structureDefinition(structure);
      state.tiles[key] = {
        ...tile,
        structure,
        structureHp: definition.maxHp,
        structureMaxHp: definition.maxHp,
      };
      spawned += 1;
    }
  }

  return spawned;
}

function maybeTriggerEarthshake(state: GameState) {
  const dayIndex = getWorldDayIndex(state.worldTimeMs);
  if (state.lastEarthshakeDay === dayIndex) return;
  state.lastEarthshakeDay = dayIndex;

  const rng = createRng(`${state.seed}:earthshake:${dayIndex}`);
  if (rng() >= EARTHSHAKE_CHANCE) return;

  openEarthshakeDungeon(state, false);
}

function openEarthshakeDungeon(state: GameState, forced: boolean) {
  const dayIndex = getWorldDayIndex(state.worldTimeMs);
  const earthshakeRng = createRng(
    `${state.seed}:earthshake:${dayIndex}:${forced ? 'forced' : 'daily'}`,
  );
  const coord = findNearbyDungeonSpawn(
    state,
    earthshakeRng,
    forced ? EARTHSHAKE_SPAWN_RADIUS + 6 : EARTHSHAKE_SPAWN_RADIUS + 3,
  );
  if (!coord) return false;

  const key = hexKey(coord);
  const tile = state.tiles[key];
  const enemyIds = Array.from(
    { length: 1 + Math.floor(earthshakeRng() * 3) },
    (_, index) => enemyKey(coord, index),
  );
  state.tiles[key] = {
    ...tile,
    structure: 'dungeon',
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds,
  };
  enemyIds.forEach((enemyId, index) => {
    state.enemies[enemyId] = makeEnemy(
      state.seed,
      coord,
      tile.terrain,
      index,
      'dungeon',
      state.bloodMoonActive,
    );
  });
  addLog(
    state,
    'system',
    t('game.message.earthshake.open', { q: coord.q, r: coord.r }),
  );
  return true;
}

function findNearbyDungeonSpawn(
  state: GameState,
  rng: () => number,
  searchRadius: number,
) {
  const candidates: HexCoord[] = [];

  for (let dq = -searchRadius; dq <= searchRadius; dq += 1) {
    for (let dr = -searchRadius; dr <= searchRadius; dr += 1) {
      const coord = {
        q: state.player.coord.q + dq,
        r: state.player.coord.r + dr,
      };
      const distance = hexDistance(state.player.coord, coord);
      if (distance === 0 || distance > searchRadius) continue;
      if (isHomeHex(state, coord)) continue;

      ensureTileState(state, coord);
      const tile = state.tiles[hexKey(coord)];
      if (!isPassable(tile.terrain)) continue;
      if (
        tile.structure ||
        tile.enemyIds.length > 0 ||
        tile.items.length > 0 ||
        tile.claim ||
        isWorldBossFootprintOccupied(state, coord)
      ) {
        continue;
      }
      candidates.push(coord);
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort(
    (left, right) =>
      hexDistance(state.player.coord, left) -
      hexDistance(state.player.coord, right),
  );
  const nearestCandidates = candidates.filter(
    (candidate) =>
      hexDistance(state.player.coord, candidate) ===
      hexDistance(state.player.coord, candidates[0] ?? state.player.coord),
  );
  return (
    nearestCandidates[Math.floor(rng() * nearestCandidates.length)] ?? null
  );
}

function canSpawnHarvestMoonResourceOnTile(
  state: GameState,
  tile: import('./types').Tile,
) {
  return (
    isPassable(tile.terrain) &&
    !tile.claim &&
    !tile.structure &&
    tile.enemyIds.length === 0 &&
    tile.items.length === 0 &&
    !isWorldBossFootprintOccupied(state, tile.coord)
  );
}

function canSpawnBloodMoonEnemiesOnTile(
  state: GameState,
  tile: import('./types').Tile,
) {
  if (!isPassable(tile.terrain)) return false;
  if (tile.claim) return false;
  if (tile.structure && tile.structure !== 'dungeon') return false;
  if (isWorldBossFootprintOccupied(state, tile.coord)) return false;
  return true;
}

function makeBloodMoonDrop(
  state: GameState,
  enemy: import('./types').Enemy,
  index: number,
  tier: number,
  minimumRarity: 'rare' | 'epic' | 'legendary',
) {
  const coord = enemy.coord;
  const seed = `${state.seed}:blood-moon-drop:${enemy.id}:${state.turn}:${index}`;
  switch (pickBloodMoonItemKind(noise(`${seed}:roll`, coord))) {
    case 'artifact':
      return makeArtifact(seed, coord, tier, minimumRarity);
    case 'weapon':
      return makeWeapon(seed, coord, tier, minimumRarity);
    case 'offhand':
      return makeOffhand(seed, coord, tier, minimumRarity);
    default:
      return makeArmor(seed, coord, tier, minimumRarity);
  }
}
