import { createCombatActorState } from './combat';
import { syncActiveWorldAliases } from './dungeons/worldState';
import {
  getCombatEncounterEnemyIds,
  getCombatEngagementOrDefault,
} from './stateCombatEngagement';
import { cloneWorldFloatingTextAnchor } from './worldFloatingText';
import type {
  CombatState,
  Enemy,
  GameState,
  Item,
  Player,
  Tile,
  WorldFloatingTextAnchor,
  WorldFloatingTextEvent,
} from './types';

interface CopyStateSlices {
  homeHex?: boolean;
  manaAnchorHex?: boolean;
  logs?: boolean;
  combat?: boolean;
  tiles?: boolean;
  enemies?: boolean;
  player?: boolean;
}

export function copyGameState(
  state: GameState,
  slices: CopyStateSlices = {},
): GameState {
  const worlds =
    slices.tiles || slices.enemies ? copyWorlds(state.worlds) : state.worlds;
  const next: GameState = {
    ...state,
    worlds,
    dungeonEntrances: Object.fromEntries(
      Object.entries(state.dungeonEntrances).map(([key, value]) => [
        key,
        { ...value, surfaceCoord: { ...value.surfaceCoord } },
      ]),
    ),
    activeDungeon: state.activeDungeon
      ? {
          ...state.activeDungeon,
          returnCoord: { ...state.activeDungeon.returnCoord },
          surfaceCoord: { ...state.activeDungeon.surfaceCoord },
        }
      : null,
    homeHex: slices.homeHex ? { ...state.homeHex } : state.homeHex,
    manaAnchorHex:
      slices.manaAnchorHex && state.manaAnchorHex
        ? { ...state.manaAnchorHex }
        : state.manaAnchorHex,
    logs: slices.logs ? [...state.logs] : state.logs,
    worldFloatingTextEvents:
      state.worldFloatingTextEvents?.map(copyWorldFloatingTextEvent) ?? [],
    combat: slices.combat
      ? copyCombatState(state.combat, state.worldTimeMs)
      : state.combat,
    tiles: state.tiles,
    enemies: state.enemies,
    player: slices.player ? clonePlayer(state.player) : state.player,
  };

  return syncActiveWorldAliases(next);
}

function copyWorlds(worlds: GameState['worlds']): GameState['worlds'] {
  return Object.fromEntries(
    Object.entries(worlds).map(([worldId, world]) => [
      worldId,
      {
        ...world,
        tiles: cloneTiles(world.tiles),
        enemies: cloneEnemies(world.enemies),
        ...(world.kind !== 'dungeon'
          ? {}
          : {
              dungeon: {
                ...world.dungeon,
                entranceCoord: { ...world.dungeon.entranceCoord },
                finalChestCoord: { ...world.dungeon.finalChestCoord },
                surfaceEntranceCoord: { ...world.dungeon.surfaceEntranceCoord },
              },
            }),
      },
    ]),
  );
}

function copyCombatState(
  combat: CombatState | null,
  worldTimeMs: number,
): CombatState | null {
  if (!combat) {
    return null;
  }

  const combatPlayer = combat.player ?? createCombatActorState(worldTimeMs);
  const combatEnemyIds = getCombatEncounterEnemyIds(combat);
  const combatEnemies = Object.fromEntries(
    combatEnemyIds.map((enemyId) => [
      enemyId,
      combat.enemies[enemyId] ?? createCombatActorState(worldTimeMs),
    ]),
  );
  const enemyStateById = Object.fromEntries(
    combatEnemyIds.map((enemyId) => [
      enemyId,
      combat.enemyStateById[enemyId] ?? {},
    ]),
  );

  return {
    ...combat,
    coord: { ...combat.coord },
    enemyIds: [...combat.enemyIds],
    queuedEnemyIds: [...(combat.queuedEnemyIds ?? [])],
    engagement: getCombatEngagementOrDefault(combat),
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
    enemyStateById: Object.fromEntries(
      Object.entries(enemyStateById).map(([enemyId, enemyState]) => [
        enemyId,
        {
          ...(enemyState.treasureGoblin === undefined
            ? {}
            : {
                treasureGoblin: { ...enemyState.treasureGoblin },
              }),
        },
      ]),
    ),
  };
}

function copyWorldFloatingTextEvent(event: WorldFloatingTextEvent) {
  return {
    ...event,
    anchor: copyWorldFloatingTextAnchor(event.anchor),
  };
}

function copyWorldFloatingTextAnchor(anchor: WorldFloatingTextAnchor) {
  return cloneWorldFloatingTextAnchor(anchor);
}

export function cloneTiles(tiles: GameState['tiles']) {
  return Object.fromEntries(
    Object.entries(tiles).map(([key, tile]) => [key, cloneTile(tile)]),
  );
}

export function cloneItem(item: Item): Item {
  return {
    ...item,
    ...(item.tags === undefined ? {} : { tags: [...item.tags] }),
    secondaryStats: item.secondaryStats?.map((stat) => ({ ...stat })),
  };
}

export function cloneItems(items: Item[]): Item[] {
  return items.map(cloneItem);
}

function cloneStatusEffect(statusEffect: Player['statusEffects'][number]) {
  return {
    ...statusEffect,
    ...(statusEffect.tags === undefined
      ? {}
      : { tags: [...statusEffect.tags] }),
  };
}

export function cloneTile(tile: Tile): Tile {
  return {
    ...tile,
    coord: { ...tile.coord },
    items: cloneItems(tile.items),
    enemyIds: [...tile.enemyIds],
    townStockDay: tile.townStockDay,
    townStockPurchasedItemIds: tile.townStockPurchasedItemIds
      ? [...tile.townStockPurchasedItemIds]
      : undefined,
    claim: tile.claim
      ? {
          ...tile.claim,
          npc: tile.claim.npc ? { ...tile.claim.npc } : undefined,
        }
      : undefined,
  };
}

export function cloneEnemies(enemies: GameState['enemies']) {
  return Object.fromEntries(
    Object.entries(enemies).map(([key, enemy]) => [key, cloneEnemy(enemy)]),
  );
}

export function cloneEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    coord: { ...enemy.coord },
    ...(enemy.tags === undefined ? {} : { tags: [...enemy.tags] }),
    ...(enemy.dungeonSpawnCoord === undefined
      ? {}
      : { dungeonSpawnCoord: { ...enemy.dungeonSpawnCoord } }),
    statusEffects: enemy.statusEffects?.map(cloneStatusEffect),
    ...(enemy.abilityIds === undefined
      ? {}
      : { abilityIds: [...enemy.abilityIds] }),
  };
}

export function cloneEquipment(
  equipment: Player['equipment'],
): Player['equipment'] {
  return Object.fromEntries(
    Object.entries(equipment).map(([key, item]) => [
      key,
      item ? cloneItem(item) : item,
    ]),
  ) as Player['equipment'];
}

export function clonePlayer(player: Player): Player {
  return {
    ...player,
    coord: { ...player.coord },
    learnedRecipeIds: [...player.learnedRecipeIds],
    favoriteRecipeIds: [...player.favoriteRecipeIds],
    skills: Object.fromEntries(
      Object.entries(player.skills).map(([key, value]) => [key, { ...value }]),
    ) as Player['skills'],
    inventory: cloneItems(player.inventory),
    equipment: cloneEquipment(player.equipment),
    statusEffects: player.statusEffects.map(cloneStatusEffect),
  };
}
