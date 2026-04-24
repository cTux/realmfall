import {
  normalizeLoadedGame,
  normalizePersistedUiState,
  normalizeSavedUiItem,
} from './normalize';
import { ENEMY_TYPE_IDS } from '../game/content/ids';
import { RARITY_ORDER, STRUCTURE_TYPES, TERRAINS } from '../game/types';
import { createGame } from '../game/stateFactory';
import { createDefaultActionBarSlots } from './App/actionBar';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
} from './constants';

describe('normalizeLoadedGame', () => {
  it('clones valid saved game state', () => {
    const game = createGame(3, 'normalize-seed');

    expect(normalizeLoadedGame(game)).toEqual({
      ...game,
      logs: [],
    });
  });

  it('rejects malformed saved game state', () => {
    const game = createGame(3, 'normalize-seed');
    game.player.inventory[0]!.quantity = Number.NaN;

    expect(normalizeLoadedGame(game)).toBeNull();
  });

  it('rejects malformed saved ui items', () => {
    expect(normalizeSavedUiItem({ id: 'broken' })).toBeNull();
  });

  it('clones valid saved ui items', () => {
    const game = createGame(3, 'normalize-ui-item-seed');
    const item = game.player.inventory[0]!;

    expect(normalizeSavedUiItem(item)).toEqual(item);
  });

  it('refreshes configured item names from canonical item configs', () => {
    const normalized = normalizeSavedUiItem({
      id: 'ration-1',
      itemKey: 'trail-ration',
      name: 'game.item.trail-ration.name',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 10,
      hunger: 15,
      thirst: 0,
    });

    expect(normalized?.name).toBe('Trail Ration');
  });

  it('accepts canonical runtime save values from shared game constants', () => {
    const game = createGame(3, 'normalize-runtime-values-seed');
    const homeKey = `${game.homeHex.q},${game.homeHex.r}`;
    const lastTerrain = TERRAINS[TERRAINS.length - 1]!;
    const lastStructure = STRUCTURE_TYPES[STRUCTURE_TYPES.length - 1]!;
    const lastRarity = RARITY_ORDER[RARITY_ORDER.length - 1]!;
    const lastEnemyTypeId = ENEMY_TYPE_IDS[ENEMY_TYPE_IDS.length - 1]!;
    const enemyId = 'normalize-enemy';

    game.tiles[homeKey] = {
      ...game.tiles[homeKey]!,
      terrain: lastTerrain,
      structure: lastStructure,
    };
    game.player.inventory[0] = {
      ...game.player.inventory[0]!,
      rarity: lastRarity,
    };
    game.tiles[homeKey]!.enemyIds = [enemyId];
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: lastEnemyTypeId,
      name: 'Normalize Enemy',
      coord: { ...game.homeHex },
      rarity: lastRarity,
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(normalizeLoadedGame(game)).toEqual({
      ...game,
      logs: [],
    });
  });

  it('backfills missing enemy type ids from legacy enemy names', () => {
    const game = createGame(3, 'normalize-enemy-type-seed');
    const enemyId = 'normalize-wolf';

    game.tiles['0,0']!.enemyIds = [enemyId];
    game.enemies[enemyId] = {
      id: enemyId,
      name: 'Wolf',
      coord: { ...game.homeHex },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };

    expect(normalizeLoadedGame(game)?.enemies[enemyId]?.enemyTypeId).toBe(
      'wolf',
    );
  });
});

describe('normalizePersistedUiState', () => {
  it('falls back to defaults when persisted ui is malformed', () => {
    expect(normalizePersistedUiState('{not-an-object')).toEqual({
      actionBarSlots: createDefaultActionBarSlots(),
      logFilters: DEFAULT_LOG_FILTERS,
      windowShown: DEFAULT_WINDOW_VISIBILITY,
      windows: DEFAULT_WINDOWS,
    });
  });

  it('drops malformed action bar items and window values', () => {
    const game = createGame(3, 'normalize-ui-state-seed');

    expect(
      normalizePersistedUiState({
        actionBarSlots: [
          { item: game.player.inventory[0] },
          { item: { id: 1 } },
        ],
        logFilters: {
          movement: false,
          combat: 'yes',
        },
        windowShown: {
          hero: true,
          inventory: 'open',
        },
        windows: {
          hero: { x: 10, y: 12, width: -4 },
          inventory: { x: 'bad', y: 20 },
        },
      }),
    ).toEqual({
      actionBarSlots: [
        { item: game.player.inventory[0] },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      logFilters: {
        ...DEFAULT_LOG_FILTERS,
        movement: false,
      },
      windowShown: {
        ...DEFAULT_WINDOW_VISIBILITY,
        hero: true,
      },
      windows: {
        ...DEFAULT_WINDOWS,
        hero: {
          ...DEFAULT_WINDOWS.hero,
          x: 10,
          y: 12,
        },
        inventory: {
          ...DEFAULT_WINDOWS.inventory,
          y: 20,
        },
      },
    });
  });
});
