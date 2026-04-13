import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createGame } from '../../game/state';
import { getWorldHexSize, tileToPoint } from '../../ui/world/renderSceneMath';
import { mapWorldMapFishEyeSourcePointToDisplayPoint } from '../../ui/world/worldMapFishEye';
import styles from './styles.module.scss';

const renderScene = vi.fn();
const loadEncryptedState = vi.fn();
const saveEncryptedState = vi.fn();
const tickerCallbacks = new Set<() => void>();

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
    renderer = { resize: vi.fn() };
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

    constructor(options: { width: number; height: number }) {
      this.screen = { width: options.width, height: options.height };
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

vi.mock('../../persistence/storage', () => ({
  loadEncryptedState,
  saveEncryptedState,
}));

vi.mock('../../ui/world/renderScene', () => ({
  renderScene,
}));

vi.mock('react-fps-stats', () => ({
  default: () => <div>FPS Graph</div>,
}));

describe('App', () => {
  const flushLazyModules = async () => {
    await act(async () => {
      for (let index = 0; index < 3; index += 1) {
        await vi.dynamicImportSettled();
        await Promise.resolve();
      }
    });
  };

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
  });

  it('hydrates saved state, handles ui interactions, and responds to map input', async () => {
    const game = createGame(3, 'app-test-seed');
    game.homeHex = { q: 2, r: -1 };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      structure: 'forge',
      items: [
        {
          id: 'loot-gold',
          kind: 'resource',
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
        kind: 'consumable',
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
        kind: 'armor',
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

    let resolveLoad: ((value: unknown) => void) | null = null;
    loadEncryptedState.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const { App } = await import('./index');
    const host = document.createElement('div');
    document.body.appendChild(host);
    let root: Root | null = createRoot(host);

    await act(async () => {
      root?.render(<App />);
    });

    expect(host.querySelector(`.${styles.loadingScreen}`)).not.toBeNull();
    expect(host.querySelector(`.${styles.loadingSpinner}`)).not.toBeNull();

    await act(async () => {
      resolveLoad?.({
        game: {
          ...game,
          logs: [
            { id: 'persisted-log', kind: 'system', text: 'old log', turn: 99 },
          ],
        },
        ui: {
          windows: { hero: { x: 30, y: 40 } },
          windowShown: {
            worldTime: true,
            hero: false,
            skills: true,
            recipes: true,
            hexInfo: true,
            equipment: true,
            inventory: true,
            loot: true,
            log: true,
            combat: true,
          },
        },
      });
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await flushLazyModules();

    expect(loadEncryptedState).toHaveBeenCalledTimes(1);
    expect(renderScene).toHaveBeenCalled();
    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(host.querySelector(`.${styles.loadingScreen}`)).toBeNull();
    expect(host.textContent).toContain('(D)ebugger');
    expect(host.textContent).toContain('FPS Graph');
    expect(host.textContent).not.toContain('(C)haracter info');
    expect(host.textContent).toContain('(S)kills');
    expect(host.textContent).toContain('(R)ecipe book');
    expect(host.textContent).toContain('(H)ex info');
    expect(host.textContent).not.toContain('old log');
    expect(host.textContent).toContain('Lo(g)');
    expect(host.textContent).toContain('Year 1, Day 1, 00:00');

    const worldTimePanel = host.querySelector(
      '[aria-label="Debugger"]',
    ) as HTMLDivElement | null;
    const initialWorldTimePanelText = worldTimePanel?.textContent;

    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(saveEncryptedState).not.toHaveBeenCalled();
    expect(worldTimePanel?.textContent).not.toBe(initialWorldTimePanelText);
    expect(worldTimePanel?.textContent).toMatch(
      /Year \d+, Day \d+, \d{2}:\d{2}/,
    );
    expect(host.textContent).toContain('FPS Graph');
    expect(host.textContent).not.toContain('Hunger penalty');
    expect(host.textContent).toContain('Loot');
    expect(host.textContent).toContain('Prospect');

    const heroDockButton = host.querySelector(
      '[aria-label="Toggle Character info window"]',
    ) as HTMLButtonElement | null;
    const worldTimeDockButton = host.querySelector(
      '[aria-label="Toggle Debugger window"]',
    ) as HTMLButtonElement | null;
    expect(heroDockButton).not.toBeNull();
    expect(worldTimeDockButton?.getAttribute('aria-pressed')).toBe('true');
    expect(heroDockButton?.getAttribute('aria-pressed')).toBe('false');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'd' }),
      );
    });
    expect(host.textContent).not.toContain('(D)ebugger');
    expect(worldTimeDockButton?.getAttribute('aria-pressed')).toBe('false');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'c' }),
      );
    });
    await flushLazyModules();
    expect(host.textContent).toContain('(C)haracter info');
    expect(host.textContent).toContain('Hunger');
    expect(heroDockButton?.getAttribute('aria-pressed')).toBe('true');

    const filterButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Filters',
    );
    await act(async () => {
      filterButton?.click();
    });
    expect(host.textContent).toContain('movement');

    const checkbox = host.querySelector('input[type="checkbox"]');
    await act(async () => {
      checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const logDockButton = host.querySelector(
      '[aria-label="Toggle Log window"]',
    ) as HTMLButtonElement | null;
    expect(logDockButton?.getAttribute('aria-pressed')).toBe('true');

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'g' }),
      );
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(host.textContent).not.toContain('Filters');
    expect(logDockButton?.getAttribute('aria-pressed')).toBe('false');

    const inventoryConsumable = host.querySelector('[aria-label="consumable"]')
      ?.parentElement as HTMLButtonElement | null;
    expect(inventoryConsumable).not.toBeNull();

    await act(async () => {
      inventoryConsumable?.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true }),
      );
    });

    await act(async () => {
      inventoryConsumable?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          clientX: 80,
          clientY: 120,
        }),
      );
    });
    await flushLazyModules();
    expect(host.textContent).toContain('Use');

    const useButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Use',
    );
    await act(async () => {
      useButton?.click();
    });

    const takeAllButton = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent === 'Tak(e) all',
    );
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'e' }),
      );
      await Promise.resolve();
    });

    expect(takeAllButton).not.toBeNull();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const screenCenter = {
      x: Math.max(window.innerWidth, 640) / 2,
      y: Math.max(window.innerHeight, 480) / 2,
    };
    const hexSize = getWorldHexSize(
      {
        width: Math.max(window.innerWidth, 640),
        height: Math.max(window.innerHeight, 480),
      },
      game.radius,
    );
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      screenCenter.x,
      screenCenter.y,
      hexSize,
    );
    const adjacentDisplayPoint = mapWorldMapFishEyeSourcePointToDisplayPoint(
      adjacentPoint,
      {
        width: Math.max(window.innerWidth, 640),
        height: Math.max(window.innerHeight, 480),
      },
      screenCenter,
    );
    const adjacentX = adjacentDisplayPoint.x;
    const adjacentY = adjacentDisplayPoint.y;

    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          clientX: adjacentX,
          clientY: adjacentY,
        }),
      );
    });
    await act(async () => {
      canvas?.dispatchEvent(
        new MouseEvent('pointerdown', {
          bubbles: true,
          clientX: adjacentX,
          clientY: adjacentY,
        }),
      );
    });

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    expect(renderScene.mock.calls.length).toBeGreaterThan(1);
    expect(saveEncryptedState).toHaveBeenCalled();
    expect(saveEncryptedState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        game: expect.objectContaining({ logs: [] }),
        ui: expect.objectContaining({
          windowShown: expect.objectContaining({ hero: true }),
        }),
      }),
    );

    await act(async () => {
      root?.unmount();
    });
    root = null;
    host.remove();
  });
});
