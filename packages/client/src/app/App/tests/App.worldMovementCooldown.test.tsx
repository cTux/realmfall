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

describe('App world movement cooldown', () => {
  it('moves one resolved hex per cooldown window while auto-continuing a queued path', async () => {
    const game = createGame(3, 'app-movement-cooldown');
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
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(999);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 2, r: 0 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);

  it('replaces queued travel during cooldown without resetting the active cooldown', async () => {
    const game = createGame(3, 'app-movement-replacement');
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      structure: 'workshop',
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      structure: 'camp',
      enemyIds: [],
    };
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('../../../game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy
      .mockReturnValueOnce({ q: 2, r: 0 })
      .mockReturnValueOnce({ q: 0, r: -1 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      await flushLazyModules();

      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      await flushLazyModules();
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: -1 });
      expect(findRecipeBookDockButton(host)?.dataset.opened).toBe('true');
      expect(getTab(host, 'Cooking')?.getAttribute('aria-selected')).toBe(
        'true',
      );
      expect(getTab(host, 'Crafting')?.getAttribute('aria-selected')).toBe(
        'false',
      );

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
