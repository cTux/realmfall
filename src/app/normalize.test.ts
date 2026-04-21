import {
  normalizeLoadedGame,
  normalizePersistedUiState,
  normalizeSavedUiItem,
} from './normalize';
import { createGame } from '../game/state';
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
