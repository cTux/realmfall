import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import { CancelablePromise } from 'easy-cancelable-promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createEasyWebWorker = vi.fn();
const createLocalTileResolutionSource = vi.fn();

class MockWorker {
  static instances: MockWorker[] = [];

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  terminate = vi.fn();

  constructor(
    public url: URL,
    public options: WorkerOptions,
  ) {
    MockWorker.instances.push(this);
  }
}

vi.mock('easy-web-worker', () => ({
  createEasyWebWorker,
}));

vi.mock('./createLocalTileResolutionSource', () => ({
  createLocalTileResolutionSource,
}));

describe('createWorkerTileResolutionSource', () => {
  beforeEach(() => {
    vi.resetModules();
    createEasyWebWorker.mockReset();
    createLocalTileResolutionSource.mockReset();
    MockWorker.instances = [];
    vi.stubGlobal('Worker', MockWorker as unknown as typeof Worker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('wraps a module worker instance instead of a direct URL source', async () => {
    createEasyWebWorker.mockReturnValue({
      dispose: vi.fn(async () => undefined),
      send: vi.fn(() =>
        CancelablePromise.resolve({
          requestId: 'worker-instance',
          tiles: [],
        }),
      ),
    });
    createLocalTileResolutionSource.mockReturnValue({
      dispose: vi.fn(async () => undefined),
      resolve: vi.fn(() =>
        CancelablePromise.resolve({
          requestId: 'local-instance',
          tiles: [],
        }),
      ),
    });

    const { createWorkerTileResolutionSource } =
      await import('./createWorkerTileResolutionSourceTestkit');
    const source = createWorkerTileResolutionSource();

    expect(MockWorker.instances).toHaveLength(1);
    expect(createEasyWebWorker.mock.calls[0]?.[0]).toBe(
      MockWorker.instances[0],
    );
    expect(MockWorker.instances[0]?.options).toMatchObject({
      name: 'world-tile-resolution',
      type: 'module',
    });

    await source.dispose();
  });

  it('falls back to the local resolver when the worker errors after startup', async () => {
    const request: ResolveWorldTilesRequest = {
      requestId: 'worker-runtime-failure',
      seed: 'worker-runtime-failure-seed',
      bloodMoonActive: false,
      coords: [{ q: 1, r: 0 }],
    };
    const localResponse: ResolveWorldTilesResponse = {
      requestId: request.requestId,
      tiles: [],
    };

    const workerSend = vi.fn(
      () => new CancelablePromise<ResolveWorldTilesResponse>(() => {}),
    );
    const workerDispose = vi.fn(async () => undefined);
    createEasyWebWorker.mockImplementation((_url, _options) => ({
      dispose: workerDispose,
      send: workerSend,
    }));

    const localResolve = vi.fn(() => CancelablePromise.resolve(localResponse));
    createLocalTileResolutionSource.mockReturnValue({
      dispose: vi.fn(async () => undefined),
      resolve: localResolve,
    });

    const { createWorkerTileResolutionSource } =
      await import('./createWorkerTileResolutionSourceTestkit');
    const source = createWorkerTileResolutionSource();
    const resultPromise = source.resolve(request);
    const [, options] = createEasyWebWorker.mock.calls[0] ?? [];

    options.onWorkerError?.(new Error('worker runtime failure'));

    await expect(
      Promise.race([
        resultPromise,
        new Promise<ResolveWorldTilesResponse>((_resolve, reject) => {
          setTimeout(
            () => reject(new Error('timed out waiting for local fallback')),
            25,
          );
        }),
      ]),
    ).resolves.toEqual(localResponse);

    expect(localResolve).toHaveBeenCalledWith(request);
    expect(workerSend).toHaveBeenCalledTimes(1);

    await source.dispose();
  });
});
