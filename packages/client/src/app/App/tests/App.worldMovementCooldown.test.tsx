import { act } from 'react';
import type { GameState } from '../../../game/stateTypes';
import { createGame } from '../../../game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  renderScene,
  tickerCallbacks,
  waitForAppSelector,
} from './appTestHarness';

function getRenderedGame() {
  const lastCall = renderScene.mock.calls[renderScene.mock.calls.length - 1];
  return lastCall?.[1] as GameState | undefined;
}

async function clickWorldTile(canvas: Element) {
  await act(async () => {
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        clientX: 480,
        clientY: 240,
      }),
    );
  });
}

async function renderTickerFrame() {
  await act(async () => {
    tickerCallbacks.forEach((callback) => callback());
    await Promise.resolve();
  });
}

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
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
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
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: -1 });

      await act(async () => {
        root.unmount();
      });
      host.remove();
    } finally {
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
