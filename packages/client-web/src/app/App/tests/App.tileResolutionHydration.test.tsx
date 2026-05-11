import { act } from 'react';
import { createGame } from '@realmfall/core/game/stateFactory';
import { flushLazyModules, loadEncryptedState, renderApp } from './appTestkit';

const createWorkerTileResolutionSource = vi.fn();
const createLocalTileResolutionSource = vi.fn();
const syncVisibleCoords = vi.fn();
const disposeCoordinator = vi.fn();
const createWorldTileResolutionCoordinator = vi.fn();

describe('App tile resolution hydration', () => {
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

  it('waits for persistence hydration before starting visible tile resolution', async () => {
    const savedGame = createGame(2, 'hydrated-world-seed');
    savedGame.player.coord = { q: 1, r: -1 };

    let resolveLoad: ((value: unknown) => void) | null = null;
    loadEncryptedState.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const { host, root } = await renderApp();

    expect(createWorkerTileResolutionSource).not.toHaveBeenCalled();
    expect(createLocalTileResolutionSource).not.toHaveBeenCalled();
    expect(createWorldTileResolutionCoordinator).not.toHaveBeenCalled();
    expect(syncVisibleCoords).not.toHaveBeenCalled();

    await act(async () => {
      resolveLoad?.({ game: savedGame, ui: {} });
      await Promise.resolve();
    });
    await flushLazyModules();

    expect(createWorkerTileResolutionSource).toHaveBeenCalledTimes(1);
    expect(createLocalTileResolutionSource).not.toHaveBeenCalled();
    expect(createWorldTileResolutionCoordinator).toHaveBeenCalledTimes(1);
    expect(syncVisibleCoords).toHaveBeenCalledWith(
      expect.objectContaining({
        bloodMoonActive: savedGame.bloodMoonActive,
        playerCoord: savedGame.player.coord,
        radius: savedGame.radius,
        resolvedTiles: savedGame.tiles,
        seed: savedGame.seed,
      }),
    );

    await act(async () => {
      root.unmount();
    });
    expect(disposeCoordinator).toHaveBeenCalledTimes(1);
    host.remove();
  }, 10_000);
});
