import { hexDistance, hexKey, hexNeighbors, type HexCoord } from './hex';
import { isWorldBossEnemyId } from './worldBoss';
import { t } from '../i18n';
import { formatEquipmentSlotLabel, formatSkillLabel } from '../i18n/labels';
import { Skill } from './types';
import {
  BLOOD_MOON_CHANCE,
  BLOOD_MOON_SPAWN_RADIUS,
  EARTHSHAKE_CHANCE,
  EARTHSHAKE_SPAWN_RADIUS,
  HARVEST_MOON_CHANCE,
  HARVEST_MOON_SPAWN_RADIUS,
  HOME_SCROLL_ITEM_NAME_KEY,
  STARTING_RECIPE_IDS,
  WORLD_RADIUS,
  WORLD_REVEAL_RADIUS,
} from './config';
import { createRng } from './random';
import { itemName } from './content/i18n';
import { getEnemyConfig, isAnimalEnemyType } from './content/enemies';
import {
  buildItemFromConfig,
  getItemConfig,
  getItemConfigByKey,
  getItemConfigByName,
  hasItemTag,
} from './content/items';
import { ItemId, StatusEffectTypeId } from './content/ids';
import { getStructureConfig } from './content/structures';
import {
  createCombatActorState,
  enemyKey,
  enemyIndexFromId,
  getAbilityDefinition,
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
  hasRecipeBook,
  makeHomeScroll,
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
import {
  isFactionNpcEnemyId,
  isPlayerClaim,
  makePlayerClaim,
} from './territories';
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
  getEnemyConfig,
  getItemConfig,
  getItemConfigByName,
  getGoldAmount,
  getPlayerStats,
  getStructureConfig,
  hasRecipeBook,
  isGatheringStructure,
  isAnimalEnemyType,
  isRecipeBook,
  isRecipePage,
  makeGoldStack,
  skillLevelThreshold,
  structureActionLabel,
};

import type {
  AbilityId,
  EquipmentSlot,
  GameState,
  Item,
  Player,
  PlayerStatusEffect,
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
        makeStarterArmor('chest', ItemId.ScoutJerkin, 1, 1),
        makeConsumable('starter-ration', ItemId.TrailRation, 1, 10, 15, 2),
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

export function getPlayerClaimedTiles(state: GameState) {
  return Object.values(state.tiles).filter((tile) => isPlayerClaim(tile.claim));
}

export function getCurrentHexClaimStatus(state: GameState) {
  const tile = getCurrentTile(state);
  if (tile.claim) {
    return {
      canClaim: false,
      reason: isPlayerClaim(tile.claim)
        ? t('game.message.claim.status.alreadyYours')
        : t('game.message.claim.status.belongsTo', {
            ownerName: tile.claim.ownerName,
          }),
    };
  }

  if (!isPassable(tile.terrain)) {
    return {
      canClaim: false,
      reason: t('game.message.claim.status.passableOnly'),
    };
  }

  if (
    tile.structure ||
    tile.enemyIds.length > 0 ||
    tile.items.length > 0 ||
    isWorldBossFootprintOccupied(state, tile.coord)
  ) {
    return {
      canClaim: false,
      reason: t('game.message.claim.status.emptyOnly'),
    };
  }

  const playerClaims = getPlayerClaimedTiles(state);
  if (
    playerClaims.length > 0 &&
    !hexNeighbors(tile.coord).some((neighbor) => {
      const neighborTile = state.tiles[hexKey(neighbor)];
      return isPlayerClaim(neighborTile?.claim);
    })
  ) {
    return {
      canClaim: false,
      reason: t('game.message.claim.status.mustConnect'),
    };
  }

  if (
    hexNeighbors(tile.coord).some((neighbor) => {
      const neighborTile = getTileAt(state, neighbor);
      return neighborTile.claim && !isPlayerClaim(neighborTile.claim);
    })
  ) {
    return {
      canClaim: false,
      reason: t('game.message.claim.status.nearOtherTerritory'),
    };
  }

  const clothCount = countInventoryResource(state.player.inventory, 'cloth');
  const stickCount = countInventoryResource(state.player.inventory, 'sticks');
  if (clothCount < 1 || stickCount < 1) {
    return {
      canClaim: false,
      reason: t('game.message.claim.status.needsBannerMaterials'),
    };
  }

  return { canClaim: true, reason: null };
}

export function getEnemiesAt(state: GameState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  return tile.enemyIds.map((enemyId) => {
    const enemy = state.enemies[enemyId];
    if (enemy) return enemy;

    const hostile = isHostileTileEnemy(state, tile, enemyId);
    const enemyName =
      tile.claim?.npc?.enemyId === enemyId ? tile.claim.npc?.name : undefined;

    return makeEnemy(
      state.seed,
      coord,
      tile.terrain,
      enemyIndexFromId(enemyId),
      tile.structure,
      state.bloodMoonActive,
      {
        enemyId,
        aggressive: hostile,
        name: enemyName,
        worldBoss: isWorldBossEnemyId(enemyId),
      },
    );
  });
}

export function getEnemyAt(state: GameState, coord: HexCoord) {
  return getEnemiesAt(state, coord)[0];
}

export function getHostileEnemyIds(state: GameState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  return tile.enemyIds.filter((enemyId) =>
    isHostileTileEnemy(state, tile, enemyId),
  );
}

function isHostileTileEnemy(state: GameState, tile: Tile, enemyId: string) {
  if (tile.claim?.npc?.enemyId === enemyId) return false;
  if (isFactionNpcEnemyId(enemyId)) return false;
  const enemy = state.enemies[enemyId];
  return enemy?.aggressive !== false;
}

export function getSafePathToTile(state: GameState, target: HexCoord) {
  if (state.gameOver || state.combat) return null;

  const start = state.player.coord;
  const targetDistance = hexDistance(start, target);
  if (targetDistance === 0) return [];
  if (targetDistance > state.radius) return null;
  if (targetDistance > WORLD_REVEAL_RADIUS) return null;

  const visited = new Set([hexKey(start)]);
  const queue: Array<{ coord: HexCoord; path: HexCoord[] }> = [
    { coord: start, path: [] },
  ];

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;

    for (const neighbor of hexNeighbors(next.coord)) {
      if (hexDistance(start, neighbor) > state.radius) continue;
      if (hexDistance(start, neighbor) > WORLD_REVEAL_RADIUS) continue;

      const key = hexKey(neighbor);
      if (visited.has(key)) continue;
      visited.add(key);

      const tile = getTileAt(state, neighbor);
      if (
        !isPassable(tile.terrain) ||
        getHostileEnemyIds(state, neighbor).length > 0
      )
        continue;

      const path = [...next.path, neighbor];
      if (neighbor.q === target.q && neighbor.r === target.r) {
        return path;
      }

      queue.push({ coord: neighbor, path });
    }
  }

  return null;
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

  const next = clone(state);
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
    next.combat = createCombatState(target, hostileEnemyIds, next.worldTimeMs);
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
    const next = clone(state);
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

    const next = clone(state);
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
    const next = clone(state);
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
  const next = clone(state);
  if (!openEarthshakeDungeon(next, true)) {
    addLog(next, 'system', t('game.message.earthshake.noGround'));
  }
  return next;
}

export function syncPlayerStatusEffects(
  state: GameState,
  worldTimeMs: number,
): GameState {
  const next = clone(state);
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

  const next = clone(state);
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

  const next = clone(state);
  const changed = resolveCombat(next);
  return changed ? next : state;
}

export function startCombat(state: GameState): GameState {
  if (!state.combat) return message(state, t('game.message.combat.noneActive'));
  if (state.combat.started) return state;

  const next = clone(state);
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
  const next = clone(state);

  if (canUseItem(item) && !isRecipeBook(item) && !isRecipePage(item)) {
    consumeItem(next, itemIndex, item);
    return next;
  }

  if (hasItemTag(item, GAME_TAGS.item.resource))
    return message(state, t('game.message.equipment.resourcesCannotBeEquipped'));

  next.player.inventory.splice(itemIndex, 1);
  if (!item.slot) return message(state, t('game.message.equipment.cannotEquip'));

  const replaced = next.player.equipment[item.slot];
  if (replaced) addItemToInventory(next.player.inventory, replaced);
  next.player.equipment[item.slot] = item;
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
  if (isRecipeBook(item)) {
    return message(state, t('game.message.recipeBook.openFromPack'));
  }
  if (isRecipePage(item)) {
    const next = clone(state);
    learnRecipe(next, item, RECIPE_BOOK_RECIPES, addLog);
    consumeInventoryItem(next.player.inventory, itemIndex, item);
    return next;
  }
  if (!hasItemTag(item, GAME_TAGS.item.consumable))
    return message(state, t('game.message.item.cannotUse'));

  const next = clone(state);
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
  coord: HexCoord,
  enemyIds: string[],
  worldTimeMs: number,
): GameState['combat'] {
  return {
    coord,
    enemyIds: [...enemyIds],
    started: false,
    player: createCombatActorState(worldTimeMs),
    enemies: Object.fromEntries(
      enemyIds.map((enemyId) => [enemyId, createCombatActorState(worldTimeMs)]),
    ),
  };
}

function resolveCombat(state: GameState) {
  if (!state.combat) return false;

  let changed = false;
  let keepResolving = true;

  while (state.combat && keepResolving) {
    keepResolving = false;

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
    return (
      canActorCastAbility(actor, candidate, now) &&
      state.player.mana >= ability.manaCost
    );
  });
  if (!abilityId) return false;

  const targetId = selectEnemyGroupTarget(state);
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

    const abilityId = actor.abilityIds.find((candidate) =>
      canActorCastAbility(actor, candidate, now),
    );

    if (!abilityId) return;

    const targetId = selectPlayerGroupTarget(state);
    if (!targetId) return;

    startAbilityCast(actor, abilityId, targetId, now);
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

function scaledCooldownMs(baseCooldownMs: number, attackSpeed: number) {
  const safeAttackSpeed = Math.max(0.01, attackSpeed);
  return Math.max(1, Math.round(baseCooldownMs / safeAttackSpeed));
}

function applyPlayerAbility(
  state: GameState,
  abilityId: AbilityId,
  targetId: string,
) {
  if (abilityId !== 'kick') return;

  const enemy = state.enemies[targetId];
  if (!enemy) return;

  const playerStats = getPlayerStats(state.player);
  const damage = Math.max(1, playerStats.attack - enemy.defense);
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(
    state,
    'combat',
    t('game.message.combat.playerKick', { enemy: enemy.name, damage }),
  );

  if (enemy.hp <= 0) {
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

function applyEnemyAbility(
  state: GameState,
  enemyId: string,
  abilityId: AbilityId,
) {
  if (!state.combat || abilityId !== 'kick') return;

  const enemy = state.enemies[enemyId];
  if (!enemy) return;

  const damage = Math.max(
    1,
    enemy.attack - getPlayerStats(state.player).defense,
  );
  state.player.hp = Math.max(0, state.player.hp - damage);
  addLog(
    state,
    'combat',
    t('game.message.combat.enemyKick', { enemy: enemy.name, damage }),
  );

  if (state.player.hp <= 0) {
    respawnAtNearestTown(state, state.combat.coord);
  }
}

export function unequipItem(state: GameState, slot: EquipmentSlot): GameState {
  if (state.gameOver) return state;

  const equipped = state.player.equipment[slot];
  if (!equipped) return message(state, t('game.message.equipment.slotEmpty'));

  const next = clone(state);
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

export function sortInventory(state: GameState): GameState {
  const next = clone(state);
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
  const sellable = state.player.inventory.filter(isEquippableItem);
  if (sellable.length === 0)
    return message(state, t('game.message.sell.empty'));

  const next = clone(state);
  const gold = sellable.reduce((sum, item) => sum + sellValue(item), 0);
  next.player.inventory = next.player.inventory.filter(
    (item) => !isEquippableItem(item),
  );
  addItemToInventory(next.player.inventory, makeGoldStack(gold));
  addLog(next, 'system', t('game.message.sell.success', { gold }));
  return next;
}

export function prospectInventory(state: GameState): GameState {
  if (getCurrentTile(state).structure !== 'forge') {
    return message(state, t('game.message.prospect.forgeOnly'));
  }

  const next = clone(state);
  const prospectable = next.player.inventory.filter(isEquippableItem);
  if (prospectable.length === 0) {
    return message(state, t('game.message.prospect.empty'));
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
  addLog(next, 'loot', t('game.message.prospect.success'));
  return next;
}

export function takeTileItem(state: GameState, itemId: string): GameState {
  const next = clone(state);
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

  const next = clone(state);
  ensureTileState(next, next.player.coord);
  const key = hexKey(next.player.coord);
  const tile = next.tiles[key];

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

  const next = clone(state);
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
  const reward = makeResourceStack(
    definition.rewardItemKey,
    definition.rewardTier,
    quantity,
  );
  addItemToInventory(next.player.inventory, reward);
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
      item: describeItemStack(reward),
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

  const next = clone(state);
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
  const next = clone(state);
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
  const next = clone(state);
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

  const next = clone(state);
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

export function craftRecipe(state: GameState, recipeId: string): GameState {
  if (state.gameOver) return state;

  const recipe = RECIPE_BOOK_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return message(state, t('game.message.recipe.notInBook'));
  if (!hasRecipeBook(state.player.inventory)) {
    return message(state, t('game.message.recipe.needsBook'));
  }
  if (!state.player.learnedRecipeIds.includes(recipe.id)) {
    return message(state, t('game.message.recipe.notLearned'));
  }
  const requiredStructure =
    recipe.skill === Skill.Cooking ? 'camp' : 'workshop';
  const requiredLabel = getStructureConfig(requiredStructure).title.toLowerCase();
  if (getCurrentTile(state).structure !== requiredStructure) {
    return message(
      state,
      t('game.message.recipe.requiresStation', {
        station: requiredLabel,
        action: recipe.skill === Skill.Cooking ? 'cook' : 'craft',
      }),
    );
  }
  if (!hasAllRequirements(state.player.inventory, recipe.ingredients)) {
    return message(
      state,
      t('game.message.recipe.missingMaterials', { item: recipe.output.name }),
    );
  }

  const chosenFuel = recipe.fuelOptions
    ? pickSatisfiedRequirement(state.player.inventory, recipe.fuelOptions)
    : undefined;
  if (recipe.fuelOptions && !chosenFuel) {
    return message(
      state,
      t('game.message.recipe.needsFuel'),
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
    recipe.skill === Skill.Cooking
      ? t('game.message.craft.cook', {
          item: recipe.output.name,
          fuel: chosenFuel
            ? ` ${t('ui.common.with')} ${describeRequirement(chosenFuel)}`
            : '',
        })
      : t('game.message.craft.make', { item: recipe.output.name }),
  );
  return next;
}

function consumeItem(state: GameState, itemIndex: number, item: Item) {
  consumeInventoryItem(state.player.inventory, itemIndex, item);
  const maxHp = getPlayerStats(state.player).maxHp;
  state.player.hp = Math.min(maxHp, state.player.hp + item.healing);
  state.player.hunger = Math.min(100, state.player.hunger + item.hunger);
  state.player.thirst = Math.min(
    100,
    (state.player.thirst ?? 100) + (item.thirst ?? 0),
  );
  addLog(
    state,
    'survival',
    t('game.message.useItem', {
      item: item.name,
      healing:
        item.healing > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.healing', { amount: item.healing })}`
          : '',
      hunger:
        item.hunger > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.hunger', { amount: item.hunger })}`
          : '',
      thirst:
        (item.thirst ?? 0) > 0
          ? ` ${t('ui.common.and')} ${t('game.message.useItem.thirst', { amount: item.thirst ?? 0 })}`
          : '',
    }),
  );
}

function teleportHome(state: GameState, itemIndex: number, item: Item) {
  consumeInventoryItem(state.player.inventory, itemIndex, item);
  state.player.coord = { ...state.homeHex };
  state.combat = null;
  addLog(state, 'system', t('game.message.home.scroll', { item: item.name }));
}

function respawnAtNearestTown(state: GameState, from: HexCoord) {
  void from;
  const homeHex = { ...state.homeHex };
  state.player.coord = homeHex;
  state.player.hunger = 100;
  state.player.thirst = 100;
  upsertPlayerStatusEffect(state.player.statusEffects, {
    id: StatusEffectTypeId.RecentDeath,
  });
  upsertPlayerStatusEffect(state.player.statusEffects, {
    id: StatusEffectTypeId.Restoration,
    expiresAt: state.worldTimeMs + 100_000,
    tickIntervalMs: 1_000,
    lastProcessedAt: state.worldTimeMs,
  });
  state.player.hp = 1;
  state.player.mana = 1;
  state.player.hp = Math.min(
    state.player.hp,
    getPlayerStats(state.player).maxHp,
  );
  state.combat = null;
  addLog(state, 'combat', t('game.message.combat.defeated'));
  addLog(
    state,
    'system',
    t('game.message.combat.respawn', { q: homeHex.q, r: homeHex.r }),
  );
}

function applySurvivalDecay(state: GameState) {
  processPlayerStatusEffects(state);
  state.player.hunger = Math.max(0, state.player.hunger - 1);
  state.player.thirst = Math.max(0, (state.player.thirst ?? 100) - 1);

  let damage = 0;
  if (state.player.hunger <= 30) {
    damage += 1;
    addLog(state, 'survival', t('game.message.survival.starving'));
  }
  if ((state.player.thirst ?? 100) <= 30) {
    damage += 1;
    addLog(state, 'survival', t('game.message.survival.dehydrated'));
  }

  if (damage > 0) {
    state.player.hp = Math.max(0, state.player.hp - damage);
  }
}

function processPlayerStatusEffects(state: GameState) {
  let changed = false;
  const remainingEffects: PlayerStatusEffect[] = [];

  state.player.statusEffects.forEach((effect) => {
    if (effect.id !== 'restoration') {
      remainingEffects.push(effect);
      return;
    }

    const lastProcessedAt = effect.lastProcessedAt ?? state.worldTimeMs;
    const effectEndAt = effect.expiresAt ?? lastProcessedAt;
    const effectiveNow = Math.min(state.worldTimeMs, effectEndAt);
    const tickIntervalMs = effect.tickIntervalMs ?? 1_000;
    const tickCount = Math.floor(
      Math.max(0, effectiveNow - lastProcessedAt) / tickIntervalMs,
    );

    if (tickCount > 0) {
      const stats = getPlayerStats(state.player);
      state.player.hp = Math.min(
        stats.maxHp,
        state.player.hp +
          Math.max(1, Math.floor(stats.maxHp * 0.01)) * tickCount,
      );
      state.player.mana = Math.min(
        state.player.baseMaxMana,
        state.player.mana +
          Math.max(1, Math.floor(state.player.baseMaxMana * 0.01)) * tickCount,
      );
      changed = true;
    }

    if (effect.expiresAt != null && state.worldTimeMs >= effect.expiresAt) {
      changed = true;
      return;
    }

    const nextLastProcessedAt = lastProcessedAt + tickCount * tickIntervalMs;
    if (nextLastProcessedAt !== effect.lastProcessedAt) {
      changed = true;
    }

    remainingEffects.push({
      ...effect,
      lastProcessedAt: nextLastProcessedAt,
    });
  });

  if (remainingEffects.length !== state.player.statusEffects.length) {
    changed = true;
  }

  state.player.statusEffects = remainingEffects;
  const maxHp = getPlayerStats(state.player).maxHp;
  if (state.player.hp > maxHp) {
    state.player.hp = maxHp;
    changed = true;
  }

  return changed;
}

function upsertPlayerStatusEffect(
  statusEffects: PlayerStatusEffect[],
  effect: PlayerStatusEffect,
) {
  const existingIndex = statusEffects.findIndex(
    (current) => current.id === effect.id,
  );
  if (existingIndex >= 0) {
    statusEffects[existingIndex] = effect;
    return;
  }

  statusEffects.push(effect);
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

function countInventoryResource(
  inventory: Item[],
  itemKey: 'cloth' | 'sticks',
) {
  return inventory.reduce((total, item) => {
    if (!hasItemTag(item, GAME_TAGS.item.resource)) return total;
    return item.itemKey === itemKey ? total + item.quantity : total;
  }, 0);
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
  const next = clone(state);
  addLog(next, 'system', text);
  return next;
}

function clone(state: GameState): GameState {
  const worldTimeMs = state.worldTimeMs;
  const combatPlayer =
    state.combat?.player ?? createCombatActorState(worldTimeMs);
  const combatEnemies = Object.fromEntries(
    (state.combat?.enemyIds ?? []).map((enemyId) => [
      enemyId,
      state.combat?.enemies?.[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );

  return {
    ...state,
    homeHex: { ...state.homeHex },
    logSequence: state.logSequence,
    logs: [...state.logs],
    combat: state.combat
      ? {
          ...state.combat,
          coord: { ...state.combat.coord },
          enemyIds: [...state.combat.enemyIds],
          started: state.combat.started,
          player: {
            ...combatPlayer,
            abilityIds: [...combatPlayer.abilityIds],
            cooldownEndsAt: { ...combatPlayer.cooldownEndsAt },
            casting: combatPlayer.casting ? { ...combatPlayer.casting } : null,
          },
          enemies: Object.fromEntries(
            Object.entries(combatEnemies).map(([enemyId, actor]) => [
              enemyId,
              {
                ...actor,
                abilityIds: [...actor.abilityIds],
                cooldownEndsAt: { ...actor.cooldownEndsAt },
                casting: actor.casting ? { ...actor.casting } : null,
              },
            ]),
          ),
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
          claim: tile.claim
            ? {
                ...tile.claim,
                npc: tile.claim.npc ? { ...tile.claim.npc } : undefined,
              }
            : undefined,
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
      statusEffects: state.player.statusEffects.map((effect) => ({
        ...effect,
      })),
    },
  };
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
  const byproductName =
    structure === 'tree'
      ? 'Sticks'
      : structure === 'copper-ore' ||
          structure === 'iron-ore' ||
          structure === 'coal-ore'
        ? 'Stone'
        : null;
  if (!byproductName) return null;

  const rng = createRng(
    `${state.seed}:gather-byproduct:${structure}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  if (rng() >= (structure === 'tree' ? 0.35 : 0.3)) return null;

  return {
    item: makeResourceStack(
      byproductName === 'Sticks' ? ItemId.Sticks : ItemId.Stone,
      definition.rewardTier,
      1,
    ),
    text:
      structure === 'tree'
        ? 'You also gather a few sticks from the chopped wood.'
        : 'You also gather some stone from the broken ore seam.',
  };
}

function maybeDropEnemyGold(state: GameState, enemy: import('./types').Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
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
  const dropKeys = ['apple', 'water-flask'] as const;

  dropKeys.forEach((itemKey) => {
    const configured = getItemConfigByKey(itemKey);
    const chance = configured?.dropChance ?? 0;
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
  if (rng() >= 0.02) return;

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
  const baseTier = Math.max(1, enemy.tier + (enemy.elite ? 1 : 0));
  const minimumRarity = enemy.worldBoss
    ? 'epic'
    : enemy.elite
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
  } else if (enemy.elite || rng() < 0.45) {
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

function spawnHarvestMoonResources(state: GameState) {
  let spawned = 0;
  const resourceTypes: Array<import('./types').GatheringStructureType> = [
    'herbs',
    'tree',
    'copper-ore',
    'iron-ore',
    'coal-ore',
  ];

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
      if (rng() >= (distance <= 2 ? 0.8 : 0.45)) continue;

      const structure =
        resourceTypes[Math.floor(rng() * resourceTypes.length)] ?? 'herbs';
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

function isWorldBossFootprintOccupied(state: GameState, coord: HexCoord) {
  const center = getWorldBossCenterFromStateOrGeneration(state, coord);
  if (!center) return false;
  if (center.q === coord.q && center.r === coord.r) return false;

  const centerTile =
    state.tiles[hexKey(center)] ?? buildTile(state.seed, center);
  return centerTile.enemyIds.some(
    (enemyId) => Boolean(state.enemies[enemyId]) || isWorldBossEnemyId(enemyId),
  );
}

function getWorldBossCenterFromStateOrGeneration(
  state: GameState,
  coord: HexCoord,
) {
  for (const candidate of [coord, ...hexNeighbors(coord)]) {
    const loadedEnemyIds = state.tiles[hexKey(candidate)]?.enemyIds;
    if (loadedEnemyIds) {
      if (loadedEnemyIds.some(isWorldBossEnemyId)) {
        return candidate;
      }
      continue;
    }

    const generatedTile = buildTile(state.seed, candidate);
    if (generatedTile.enemyIds.some(isWorldBossEnemyId)) {
      return candidate;
    }
  }

  return null;
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
  const roll = noise(`${seed}:roll`, coord);
  if (roll > 0.8) return makeArtifact(seed, coord, tier, minimumRarity);
  if (roll > 0.5) return makeWeapon(seed, coord, tier, minimumRarity);
  if (roll > 0.25) return makeOffhand(seed, coord, tier, minimumRarity);
  return makeArmor(seed, coord, tier, minimumRarity);
}
