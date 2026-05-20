import { copyGameState } from '../game/stateClone';
import { syncActiveWorldAliases } from '../game/dungeons/worldState';
import {
  getDayPhase,
  getWorldDayIndex,
  normalizeWorldMinutes,
} from '../game/logs';
import * as stateApi from '../game/state';
import { getWorldTimeMinutesFromTimestamp } from '../game/worldTime';
import type { CombatState, GameState } from '../game/types';
import type { OutpostBuildableType } from '../game/stateOutposts';
import { CombatEncounter } from './CombatEncounter';
import { EnemyEntity } from './EnemyEntity';
import { EventEmitter } from './EventEmitter';
import { HexCoord } from './HexCoord';
import { Inventory } from './Inventory';
import { PlayerEntity } from './PlayerEntity';
import { Tile } from './Tile';

type HexCoordLike = HexCoord | { q: number; r: number };
type MoveToTileOptions = Parameters<typeof stateApi.moveToTile>[2];

export type RealmfallWorldEvents = {
  stateChanged: [next: GameState, previous: GameState];
  movement: [from: HexCoord, to: HexCoord];
  combatStarted: [combat: CombatEncounter];
  combatUpdated: [combat: CombatEncounter | null];
  combatEnded: [];
  inventoryChanged: [inventory: Inventory];
  worldTimeChanged: [worldTimeMs: number];
};

export interface CreateWorldOptions {
  radius?: number;
  seed?: string;
}

export class RealmfallWorld extends EventEmitter<RealmfallWorldEvents> {
  #state: GameState;

  private constructor(state: GameState) {
    super();
    this.#state = syncActiveWorldAliases(state);
  }

  static create(options: CreateWorldOptions = {}): RealmfallWorld {
    return new RealmfallWorld(
      stateApi.createGame(
        options.radius,
        options.seed ?? `world-${Date.now()}`,
      ),
    );
  }

  static fromSave(
    input: Partial<GameState> | null | undefined,
  ): RealmfallWorld {
    if (!input) {
      return RealmfallWorld.create();
    }

    const seed =
      typeof input.seed === 'string' && input.seed.length > 0
        ? input.seed
        : `world-${Date.now()}`;
    const radius =
      typeof input.radius === 'number' &&
      Number.isFinite(input.radius) &&
      input.radius > 0
        ? input.radius
        : undefined;
    const fallback = stateApi.createGame(radius, seed);
    const merged: GameState = {
      ...fallback,
      ...input,
      seed,
      radius: radius ?? fallback.radius,
      homeHex: normalizeCoord(input.homeHex, fallback.homeHex),
      manaAnchorHex:
        input.manaAnchorHex === null
          ? null
          : normalizeCoord(input.manaAnchorHex, fallback.manaAnchorHex),
      logs: Array.isArray(input.logs) ? input.logs : fallback.logs,
      worldFloatingTextEvents: Array.isArray(input.worldFloatingTextEvents)
        ? input.worldFloatingTextEvents
        : fallback.worldFloatingTextEvents,
      tiles: isRecord(input.tiles)
        ? (input.tiles as GameState['tiles'])
        : fallback.tiles,
      enemies: isRecord(input.enemies)
        ? (input.enemies as GameState['enemies'])
        : fallback.enemies,
      worlds: isRecord(input.worlds)
        ? (input.worlds as GameState['worlds'])
        : fallback.worlds,
      dungeonEntrances: isRecord(input.dungeonEntrances)
        ? (input.dungeonEntrances as GameState['dungeonEntrances'])
        : fallback.dungeonEntrances,
      combat:
        input.combat === undefined
          ? fallback.combat
          : (input.combat as GameState['combat']),
      activeDungeon:
        input.activeDungeon === undefined
          ? fallback.activeDungeon
          : (input.activeDungeon as GameState['activeDungeon']),
      player: mergePlayerState(fallback.player, input.player),
    };

    return new RealmfallWorld(cloneGameState(merged));
  }

  get state(): Readonly<GameState> {
    return this.#state;
  }

  get player(): PlayerEntity {
    return new PlayerEntity(this.#state.player);
  }

  get enemies(): EnemyEntity[] {
    return Object.values(this.#state.enemies).map(
      (enemy) => new EnemyEntity(enemy),
    );
  }

  get combat() {
    return this.#state.combat ? this.wrapCombat(this.#state.combat) : null;
  }

  get dayPhase() {
    return getDayPhase(this.worldTimeMinutes);
  }

  get worldDay() {
    return getWorldDayIndex(this.#state.worldTimeMs);
  }

  get worldTimeMinutes() {
    return normalizeWorldMinutes(
      getWorldTimeMinutesFromTimestamp(this.#state.worldTimeMs),
    );
  }

  get visibleTiles() {
    return stateApi
      .getVisibleTiles(this.#state)
      .map((tile) => this.wrapTile(tile));
  }

  get outpostBuildStatus() {
    return stateApi.getCurrentHexOutpostBuildStatus(this.#state);
  }

  get canGatherFromPendingStagedCombat() {
    return stateApi.canGatherDuringPendingStagedCombat(this.#state);
  }

  get hasAnyEquippableItems() {
    return stateApi.hasEquippableInventoryItems(this.#state);
  }

  get offHandSlotDisabled() {
    return stateApi.isOffhandSlotDisabled(this.#state.player.equipment);
  }

  snapshot(): GameState {
    return cloneGameState(this.#state);
  }

  toJSON(): GameState {
    return this.snapshot();
  }

  moveToTile(target: HexCoordLike, options: MoveToTileOptions = {}) {
    return this.swapState(
      stateApi.moveToTile(this.#state, toRuntimeCoord(target), options),
    );
  }

  moveAlongSafePath(target: HexCoordLike) {
    return this.swapState(
      stateApi.moveAlongSafePath(this.#state, toRuntimeCoord(target)),
    );
  }

  setHomeHex(coord?: HexCoordLike) {
    return this.swapState(
      stateApi.setHomeHex(
        this.#state,
        coord === undefined ? undefined : toRuntimeCoord(coord),
      ),
    );
  }

  claimCurrentHex() {
    return this.swapState(stateApi.claimCurrentHex(this.#state));
  }

  buildOutpost(type: OutpostBuildableType) {
    return this.swapState(stateApi.buildOutpostAtCurrentHex(this.#state, type));
  }

  interactWithStructure() {
    return this.swapState(stateApi.interactWithStructure(this.#state));
  }

  interactWithStructureUntilDepleted() {
    return this.swapState(
      stateApi.interactWithStructureUntilDepleted(this.#state),
    );
  }

  healAtFactionNpc() {
    return this.swapState(stateApi.healAtFactionNpc(this.#state));
  }

  activateDungeon() {
    return this.swapState(stateApi.activateDungeonWorld(this.#state));
  }

  leaveDungeon() {
    return this.swapState(stateApi.leaveDungeonWorld(this.#state));
  }

  startCombat() {
    return this.swapState(stateApi.startCombat(this.#state));
  }

  progressCombat() {
    return this.swapState(stateApi.progressCombat(this.#state));
  }

  forfeitCombat() {
    return this.swapState(stateApi.forfeitCombat(this.#state));
  }

  attackCombatEnemy(_enemyId?: string) {
    return this.swapState(stateApi.attackCombatEnemy(this.#state));
  }

  equipItem(itemId: string) {
    return this.swapState(stateApi.equipItem(this.#state, itemId));
  }

  unequipItem(slot: Parameters<typeof stateApi.unequipItem>[1]) {
    return this.swapState(stateApi.unequipItem(this.#state, slot));
  }

  useItem(itemId: string) {
    return this.swapState(stateApi.useItem(this.#state, itemId));
  }

  activateInventoryItem(itemId: string) {
    return this.swapState(stateApi.activateInventoryItem(this.#state, itemId));
  }

  craftRecipe(recipeId: string, count: number | 'max' = 1) {
    return this.swapState(stateApi.craftRecipe(this.#state, recipeId, count));
  }

  takeTileItem(itemId: string) {
    return this.swapState(stateApi.takeTileItem(this.#state, itemId));
  }

  takeTileItems(itemIds: string[]) {
    return this.swapState(stateApi.takeTileItems(this.#state, itemIds));
  }

  takeAllTileItems() {
    return this.swapState(stateApi.takeAllTileItems(this.#state));
  }

  dropInventoryItem(itemId: string) {
    return this.swapState(stateApi.dropInventoryItem(this.#state, itemId));
  }

  dropEquippedItem(slot: Parameters<typeof stateApi.dropEquippedItem>[1]) {
    return this.swapState(stateApi.dropEquippedItem(this.#state, slot));
  }

  setInventoryItemLocked(itemId: string, locked: boolean) {
    return this.swapState(
      stateApi.setInventoryItemLocked(this.#state, itemId, locked),
    );
  }

  sortInventory() {
    return this.swapState(stateApi.sortInventory(this.#state));
  }

  prospectInventory() {
    return this.swapState(stateApi.prospectInventory(this.#state));
  }

  prospectInventoryItem(itemId: string) {
    return this.swapState(stateApi.prospectInventoryItem(this.#state, itemId));
  }

  sellAllItems() {
    return this.swapState(stateApi.sellAllItems(this.#state));
  }

  sellInventoryItem(itemId: string) {
    return this.swapState(stateApi.sellInventoryItem(this.#state, itemId));
  }

  buyTownItem(itemId: string) {
    return this.swapState(stateApi.buyTownItem(this.#state, itemId));
  }

  advanceWorldTimeForMovement(steps = 1) {
    return stateApi.advanceWorldTimeForMovement(this.#state, steps);
  }

  syncBloodMoon(worldMinutes: number) {
    return this.swapState(stateApi.syncBloodMoon(this.#state, worldMinutes));
  }

  syncPlayerStatusEffects(worldTimeMs = this.#state.worldTimeMs) {
    return this.swapState(
      stateApi.syncPlayerStatusEffects(this.#state, worldTimeMs),
    );
  }

  triggerEarthshake() {
    return this.swapState(stateApi.triggerEarthshake(this.#state));
  }

  getCurrentTile() {
    return this.wrapTile(stateApi.getCurrentTile(this.#state));
  }

  getTile(coord: HexCoordLike) {
    return this.wrapTile(
      stateApi.getTileAt(this.#state, toRuntimeCoord(coord)),
    );
  }

  getEnemiesAt(coord: HexCoordLike) {
    return stateApi
      .getEnemiesAt(this.#state, toRuntimeCoord(coord))
      .map((enemy) => new EnemyEntity(enemy));
  }

  getSafePathToTile(target: HexCoordLike) {
    return stateApi.getSafePathToTile(this.#state, toRuntimeCoord(target));
  }

  getTownStock() {
    return stateApi.getTownStock(this.#state);
  }

  getTownStockForDay(worldDayIndex = this.worldDay) {
    return stateApi.getTownStockForDay({
      player: this.#state.player,
      seed: this.#state.seed,
      tiles: this.#state.tiles,
      worldDayIndex,
    });
  }

  getRecipeBookEntries() {
    return stateApi.getRecipeBookEntries(
      this.#state.player.learnedRecipeIds,
      this.#state.player.favoriteRecipeIds,
    );
  }

  getRecipeBookRecipes() {
    return stateApi.getRecipeBookRecipes(this.#state.player.learnedRecipeIds);
  }

  private swapState(next: GameState): this {
    const previous = this.#state;
    if (next === previous) {
      return this;
    }

    this.#state = syncActiveWorldAliases(next);
    this.emitStateDiff(previous, this.#state);
    return this;
  }

  private emitStateDiff(previous: GameState, next: GameState) {
    this.emit('stateChanged', next, previous);

    if (!sameCoord(previous.player.coord, next.player.coord)) {
      this.emit(
        'movement',
        HexCoord.from(previous.player.coord),
        HexCoord.from(next.player.coord),
      );
    }

    if (previous.worldTimeMs !== next.worldTimeMs) {
      this.emit('worldTimeChanged', next.worldTimeMs);
    }

    if (previous.player.inventory !== next.player.inventory) {
      this.emit('inventoryChanged', new Inventory(next.player.inventory));
    }

    if (!previous.combat && next.combat) {
      this.emit('combatStarted', this.wrapCombat(next.combat));
    }

    if (previous.combat !== next.combat) {
      this.emit(
        'combatUpdated',
        next.combat ? this.wrapCombat(next.combat) : null,
      );
    }

    if (previous.combat && !next.combat) {
      this.emit('combatEnded');
    }
  }

  private wrapTile(tile: GameState['tiles'][string]) {
    return new Tile(tile, {
      getEnemies: (coord) => this.getEnemiesAt(coord),
    });
  }

  private wrapCombat(combat: CombatState) {
    return new CombatEncounter(combat, {
      getEnemyById: (enemyId) => this.#state.enemies[enemyId],
    });
  }
}

function cloneGameState(state: GameState): GameState {
  return copyGameState(state, {
    homeHex: true,
    manaAnchorHex: true,
    logs: true,
    combat: true,
    tiles: true,
    enemies: true,
    player: true,
  });
}

function toRuntimeCoord(coord: HexCoordLike) {
  return coord instanceof HexCoord ? coord.toRuntimeCoord() : coord;
}

function mergePlayerState(
  fallback: GameState['player'],
  player: Partial<GameState['player']> | undefined,
): GameState['player'] {
  if (!player) {
    return fallback;
  }

  return {
    ...fallback,
    ...player,
    coord: normalizeCoord(player.coord, fallback.coord),
    learnedRecipeIds: Array.isArray(player.learnedRecipeIds)
      ? player.learnedRecipeIds
      : fallback.learnedRecipeIds,
    favoriteRecipeIds: Array.isArray(player.favoriteRecipeIds)
      ? player.favoriteRecipeIds
      : fallback.favoriteRecipeIds,
    inventory: Array.isArray(player.inventory)
      ? player.inventory
      : fallback.inventory,
    equipment: isRecord(player.equipment)
      ? { ...fallback.equipment, ...player.equipment }
      : fallback.equipment,
    skills: isRecord(player.skills)
      ? { ...fallback.skills, ...player.skills }
      : fallback.skills,
    statusEffects: Array.isArray(player.statusEffects)
      ? player.statusEffects
      : fallback.statusEffects,
  };
}

function normalizeCoord<T extends { q: number; r: number } | null | undefined>(
  candidate: unknown,
  fallback: T,
): T {
  if (candidate === null) {
    return null as T;
  }

  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    'q' in candidate &&
    'r' in candidate &&
    typeof candidate.q === 'number' &&
    typeof candidate.r === 'number'
  ) {
    return { q: candidate.q, r: candidate.r } as T;
  }

  return fallback;
}

function sameCoord(
  left: { q: number; r: number },
  right: { q: number; r: number },
) {
  return left.q === right.q && left.r === right.r;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
