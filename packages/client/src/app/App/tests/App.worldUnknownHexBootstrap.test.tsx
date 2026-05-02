import { act } from 'react';
import { createGame } from '../../../game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
} from './appTestHarness';

describe('App unknown hex bootstrap', () => {
  it('preloads the first world frame with unknown placeholders for missing visible tiles', async () => {
    let bootstrappedVisibleTiles: Array<{
      coord: { q: number; r: number };
      requestedAt?: number;
      unknown?: boolean;
    }> | null = null;

    vi.doMock('../world/pixiWorldBootstrap', () => ({
      bootstrapPixiWorldCanvas: vi.fn(
        async ({
          onReady,
          visibleTilesRef,
        }: {
          onReady: (cleanup: () => void) => void;
          visibleTilesRef: {
            current: Array<{
              coord: { q: number; r: number };
              requestedAt?: number;
              unknown?: boolean;
            }>;
          };
        }) => {
          bootstrappedVisibleTiles = visibleTilesRef.current;
          onReady(() => undefined);
        },
      ),
    }));

    const game = createGame(2, 'app-unknown-bootstrap');
    delete game.tiles['1,0'];
    loadEncryptedState.mockResolvedValue({ game, ui: {} });

    const { host, root } = await renderApp();
    await flushLazyModules();
    expect(bootstrappedVisibleTiles).not.toBeNull();

    expect(bootstrappedVisibleTiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coord: { q: 2, r: 0 },
          requestedAt: 0,
          unknown: true,
        }),
      ]),
    );
    expect(bootstrappedVisibleTiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          coord: game.player.coord,
        }),
      ]),
    );

    await act(async () => {
      root.unmount();
    });
    host.remove();
  }, 10_000);
});
