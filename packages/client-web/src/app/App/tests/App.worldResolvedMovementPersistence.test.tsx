import { act } from 'react';
import { createGame } from '@realmfall/core/game/stateFactory';
import {
  flushLazyModules,
  loadEncryptedState,
  renderApp,
  waitForAppSelector,
} from './appTestkit';
import {
  clickWorldTile,
  getRenderedGame,
  renderTickerFrame,
} from './appWorldMovementTestkit';

const createWorkerTileResolutionSource = vi.fn();
const createLocalTileResolutionSource = vi.fn();
const syncVisibleCoords = vi.fn();
const disposeCoordinator = vi.fn();
const createWorldTileResolutionCoordinator = vi.fn();

describe('App resolved movement persistence', () => {
  beforeEach(() => {
    const workerSource = {
      resolve: vi.fn(),
      dispose: vi.fn(async () => undefined),
    };
    const localSource = {
      resolve: vi.fn(),
      dispose: vi.fn(async () => undefined),
    };

    createWorkerTileResolutionSource.mockReset();
    createWorkerTileResolutionSource.mockReturnValue(workerSource);
    createLocalTileResolutionSource.mockReset();
    createLocalTileResolutionSource.mockReturnValue(localSource);
    syncVisibleCoords.mockReset();
    syncVisibleCoords.mockResolvedValue(undefined);
    disposeCoordinator.mockReset();
    disposeCoordinator.mockResolvedValue(undefined);
    createWorldTileResolutionCoordinator.mockReset();
    createWorldTileResolutionCoordinator.mockImplementation(() => ({
      dispose: disposeCoordinator,
      getOverlay: () => new Map(),
      syncVisibleCoords,
    }));

    vi.doMock(
      '../world/tileResolution/createWorkerTileResolutionSource',
      () => ({
        createWorkerTileResolutionSource,
      }),
    );
    vi.doMock(
      '../world/tileResolution/createLocalTileResolutionSource',
      () => ({
        createLocalTileResolutionSource,
      }),
    );
    vi.doMock('../world/tileResolution/worldTileResolutionCoordinator', () => ({
      createWorldTileResolutionCoordinator,
    }));
  });

  it('keeps resolved frontier tiles available after the first queued movement step', async () => {
    const game = createGame(3, 'app-resolved-movement-persistence');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    try {
      const { host, root } = await renderApp();
      await flushLazyModules();

      const coordinatorOptions =
        createWorldTileResolutionCoordinator.mock.calls[0]?.[0];
      expect(coordinatorOptions).toBeDefined();

      await act(async () => {
        coordinatorOptions.onMergeResolvedTiles([
          {
            coord: { q: 2, r: 0 },
            tile: {
              coord: { q: 2, r: 0 },
              terrain: 'plains',
              items: [],
              enemyIds: [],
            },
            enemies: [],
          },
        ]);
        await Promise.resolve();
      });
      await flushLazyModules();

      const canvas = await waitForAppSelector(host, 'canvas');
      await clickWorldTile(canvas);
      await flushLazyModules();
      await renderTickerFrame();

      expect(getRenderedGame()?.player.coord).toEqual({ q: 1, r: 0 });

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
      hexAtPointSpy.mockRestore();
    }
  }, 10_000);
});
