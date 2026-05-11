import { act } from 'react';
import { createGame } from '@realmfall/core/game/stateFactory';
import {
  flushAnimationFrame,
  flushLazyModules,
  loadEncryptedState,
  renderScene,
  renderApp,
  tickerCallbacks,
} from './appTestkit';

const createWorkerTileResolutionSource = vi.fn();
const createLocalTileResolutionSource = vi.fn();
const syncVisibleCoords = vi.fn();
const disposeCoordinator = vi.fn();
const createWorldTileResolutionCoordinator = vi.fn();

describe('App hover refresh after tile resolution', () => {
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

  it('recomputes hover interaction when the hovered hex resolves without pointer movement', async () => {
    const game = createGame(2, 'app-hover-resolution-refresh');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 2, r: 0 });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    await act(async () => {
      canvas?.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 480,
          clientY: 300,
        }),
      );
    });
    await flushAnimationFrame();

    expect(canvas?.style.cursor).toBe('default');

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
      coordinatorOptions.onOverlayChange(
        new Map([
          [
            '2,0',
            {
              status: 'revealed',
              requestedAt: 100,
              resolvedAt: 200,
            },
          ],
        ]),
      );
      await Promise.resolve();
    });
    await flushAnimationFrame();

    expect(canvas?.style.cursor).toBe('pointer');

    await act(async () => {
      root.unmount();
    });
    host.remove();
    hexAtPointSpy.mockRestore();
  }, 10_000);

  it('keeps current hover feedback visible while another tile resolves in the background', async () => {
    const game = createGame(2, 'app-hover-resolution-stability');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    await act(async () => {
      canvas?.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 480,
          clientY: 300,
        }),
      );
    });
    await flushAnimationFrame();

    expect(canvas?.style.cursor).toBe('pointer');

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
      coordinatorOptions.onOverlayChange(
        new Map([
          [
            '2,0',
            {
              status: 'revealed',
              requestedAt: 100,
              resolvedAt: 200,
            },
          ],
        ]),
      );
      await Promise.resolve();
    });

    expect(canvas?.style.cursor).toBe('pointer');
    await flushAnimationFrame();
    expect(canvas?.style.cursor).toBe('pointer');

    await act(async () => {
      root.unmount();
    });
    host.remove();
    hexAtPointSpy.mockRestore();
  }, 10_000);

  it('keeps the hovered move highlight on the next render tick while background resolution refreshes hover analysis', async () => {
    const game = createGame(2, 'app-hover-resolution-highlight');
    loadEncryptedState.mockResolvedValue({ game, ui: {} });
    const hexModule = await import('@realmfall/core/game/hex');
    const hexAtPointSpy = vi.spyOn(hexModule, 'hexAtPoint');
    hexAtPointSpy.mockReturnValue({ q: 1, r: 0 });

    const { host, root } = await renderApp();
    await flushLazyModules();

    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();

    renderScene.mockClear();
    await act(async () => {
      canvas?.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 480,
          clientY: 300,
        }),
      );
    });
    await flushAnimationFrame();

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
      await Promise.resolve();
    });

    const initialRenderCall =
      renderScene.mock.calls[renderScene.mock.calls.length - 1];
    expect(initialRenderCall?.[4]).toEqual({ q: 1, r: 0 });

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
      coordinatorOptions.onOverlayChange(
        new Map([
          [
            '2,0',
            {
              status: 'revealed',
              requestedAt: 100,
              resolvedAt: 200,
            },
          ],
        ]),
      );
      await Promise.resolve();
    });

    await act(async () => {
      tickerCallbacks.forEach((callback) => callback());
      await Promise.resolve();
    });

    const refreshedRenderCall =
      renderScene.mock.calls[renderScene.mock.calls.length - 1];
    expect(refreshedRenderCall?.[4]).toEqual({ q: 1, r: 0 });

    await act(async () => {
      root.unmount();
    });
    host.remove();
    hexAtPointSpy.mockRestore();
  }, 10_000);
});
