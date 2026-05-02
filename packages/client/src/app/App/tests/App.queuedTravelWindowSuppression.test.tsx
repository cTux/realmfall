import { act } from 'react';
import { createGame } from '../../../game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  waitForAppSelector,
} from './appTestHarness';
import {
  clickWorldTile,
  findRecipeBookDockButton,
  getRenderedGame,
  getTab,
  renderTickerFrame,
} from './appWorldMovementTestHelpers';

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
    const hexModule = await import('../../../game/hex');
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

  it('clears queued travel on ambush and does not continue after cooldown expiry', async () => {
    const { GAME_CONFIG } = await import('../../../game/config');
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
    const hexModule = await import('../../../game/hex');
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
