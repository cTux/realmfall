import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/state';
import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from '../../../game/config';

export const renderScene = vi.fn();
export const loadEncryptedState = vi.fn();
export const saveEncryptedState = vi.fn();
export const clearEncryptedState = vi.fn();
export const tickerCallbacks = new Set<() => void>();
export const applicationOptions: Array<Record<string, unknown>> = [];

class MockStage {
  removeChildren() {
    return [];
  }

  addChild() {}
}

vi.mock('pixi.js', () => {
  class MockApplication {
    stage = new MockStage();
    screen = { width: 800, height: 600 };
    renderer = {
      resize: vi.fn((width: number, height: number) => {
        this.screen = { width, height };
      }),
      resolution: 1,
    };
    ticker = {
      add: vi.fn((callback: () => void) => {
        tickerCallbacks.add(callback);
      }),
      remove: vi.fn((callback: () => void) => {
        tickerCallbacks.delete(callback);
      }),
    };
    view = document.createElement('canvas');
    destroy = vi.fn();

    constructor(options: {
      width: number;
      height: number;
      resolution?: number;
      autoDensity?: boolean;
    }) {
      applicationOptions.push(options as unknown as Record<string, unknown>);
      this.screen = { width: options.width, height: options.height };
      this.renderer.resolution = options.resolution ?? 1;
      Object.defineProperty(this.view, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      });
    }
  }

  return {
    Application: MockApplication,
    Filter: class MockFilter {},
  };
});

vi.mock('../../../persistence/storage', () => ({
  clearEncryptedState,
  loadEncryptedState,
  saveEncryptedState,
}));

vi.mock('../../../ui/world/renderScene', () => ({
  renderScene,
}));

vi.mock('react-fps-stats', () => ({
  default: () => <div>FPS Graph</div>,
}));

export async function flushLazyModules() {
  await act(async () => {
    for (let index = 0; index < 6; index += 1) {
      await vi.dynamicImportSettled();
      await Promise.resolve();
    }
  });
}

export async function renderApp() {
  const { App } = await import('../index');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(<App />);
  });

  return { host, root };
}

export function createHydratedAppGame() {
  const game = createGame(3, 'app-test-seed');
  game.homeHex = { q: 2, r: -1 };
  game.worldTimeMs =
    2 * GAME_DAY_DURATION_MS + (15 / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;
  game.tiles['0,0'] = {
    ...game.tiles['0,0'],
    structure: 'forge',
    items: [
      {
        id: 'loot-gold',
        name: 'Gold',
        quantity: 5,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ],
  };
  game.player.inventory = [
    {
      id: 'food-1',
      name: 'Trail Ration',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 8,
      hunger: 12,
    },
    {
      id: 'armor-1',
      slot: 'head',
      name: 'Scout Hood',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    },
  ];
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: ['enemy-1,0-0'],
  };
  game.enemies['enemy-1,0-0'] = {
    id: 'enemy-1,0-0',
    name: 'Wolf',
    coord: { q: 1, r: 0 },
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 2,
    elite: false,
  };

  return game;
}

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();

  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  tickerCallbacks.clear();
  applicationOptions.length = 0;
});
