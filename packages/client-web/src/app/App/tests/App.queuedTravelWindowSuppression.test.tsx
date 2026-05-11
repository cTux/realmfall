import { act } from 'react';
import { buildItemFromConfig } from '@realmfall/core/game/content/items/itemBuilders';
import { createGame } from '@realmfall/core/game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  waitForAppSelector,
} from './appTestkit';
import {
  clickWorldTile,
  findRecipeBookDockButton,
  getRenderedGame,
  getTab,
  renderTickerFrame,
} from './appWorldMovementTestkit';

const GAMEPLAY_SETTINGS_STORAGE_KEY = 'realmfall-settings-gameplay';

describe('App queued travel window suppression', () => {
  it('skips intermediate workshop auto-open and opens the recipe book on final arrival', async () => {
    const game = createGame(3, 'queued-travel-final-workshop');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'workshop',
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'workshop',
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(findRecipeBookDockButton(host)?.dataset.opened).toBe('false');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(findRecipeBookDockButton(host)?.dataset.opened).toBe('true');
      expect(getTab(host, 'Crafting')?.getAttribute('aria-selected')).toBe(
        'true',
      );

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('does not auto-loot pass-through salvage while queued travel is active', async () => {
    const game = createGame(3, 'queued-travel-pass-through-loot');
    const passThroughLootId = 'queued-travel-pass-through-gold';
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        buildItemFromConfig('gold', {
          id: passThroughLootId,
          quantity: 7,
        }),
      ],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ autoLoot: true }),
    );
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });
      expect(getRenderedGame()?.tiles['1,0']?.items).toHaveLength(1);
      expect(
        getRenderedGame()?.player.inventory.some(
          (item) => item.id === passThroughLootId,
        ),
      ).toBe(false);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 2, r: 0 });
      expect(getRenderedGame()?.tiles['1,0']?.items).toHaveLength(1);
      expect(
        getRenderedGame()?.player.inventory.some(
          (item) => item.id === passThroughLootId,
        ),
      ).toBe(false);

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      window.localStorage.removeItem(GAMEPLAY_SETTINGS_STORAGE_KEY);
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('keeps pass-through resource gathering automated when that setting is enabled', async () => {
    const game = createGame(3, 'queued-travel-pass-through-gathering');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'tree',
      structureHp: 5,
      structureMaxHp: 5,
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    window.localStorage.setItem(
      GAMEPLAY_SETTINGS_STORAGE_KEY,
      JSON.stringify({ autoGatherResources: true }),
    );
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });
      expect(getRenderedGame()?.tiles['1,0']?.structure).toBeUndefined();
      expect(
        getRenderedGame()?.player.inventory.some(
          (item) => item.itemKey === 'logs',
        ),
      ).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 2, r: 0 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      window.localStorage.removeItem(GAMEPLAY_SETTINGS_STORAGE_KEY);
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('clears queued travel on ambush and does not continue after cooldown expiry', async () => {
    const { GAME_CONFIG } = await import('@realmfall/core/game/config');
    const previousAmbushChance = GAME_CONFIG.worldGeneration.ambush.chance;
    GAME_CONFIG.worldGeneration.ambush.chance = 1;
    const game = createGame(3, 'queued-travel-ambush');
    game.dayPhase = 'night';
    game.player.hunger = 100;
    game.player.thirst = 100;
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });
      expect(getRenderedGame()?.combat).not.toBeNull();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      GAME_CONFIG.worldGeneration.ambush.chance = previousAmbushChance;
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
