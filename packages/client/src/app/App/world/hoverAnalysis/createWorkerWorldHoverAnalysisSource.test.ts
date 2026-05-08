import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const wrap = vi.fn();
const createLocalWorldHoverAnalysisSource = vi.fn();
const workerInstances: MockWorker[] = [];

class MockWorker {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  terminate = vi.fn();

  constructor() {
    workerInstances.push(this);
  }
}

vi.mock('comlink', () => ({
  wrap,
}));

vi.mock('./createLocalWorldHoverAnalysisSource', () => ({
  createLocalWorldHoverAnalysisSource,
}));

describe('createWorkerWorldHoverAnalysisSource', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('Worker', MockWorker);
    wrap.mockReset();
    createLocalWorldHoverAnalysisSource.mockReset();
    workerInstances.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to the local analyzer when worker analysis fails', async () => {
    const localResult = {
      actionable: true,
      safePath: [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    };
    const state = {
      combat: null,
      enemies: {},
      gameOver: false,
      player: { coord: { q: 0, r: 0 } },
      radius: 3,
      revealRadius: 4,
      tiles: {},
    };

    const workerApi = {
      analyze: vi.fn(async () => {
        throw new Error('worker analyze failed');
      }),
      syncState: vi.fn(async () => undefined),
    };
    wrap.mockReturnValue(workerApi);

    const localAnalyze = vi.fn(async () => localResult);
    const localSyncState = vi.fn(async () => undefined);
    const localDispose = vi.fn(async () => undefined);
    createLocalWorldHoverAnalysisSource.mockReturnValue({
      analyze: localAnalyze,
      dispose: localDispose,
      syncState: localSyncState,
    });

    const { createWorkerWorldHoverAnalysisSource } = await import(
      './createWorkerWorldHoverAnalysisSourceTestkit'
    );
    const source = createWorkerWorldHoverAnalysisSource();

    await source.syncState(state);

    await expect(source.analyze({ q: 2, r: 0 })).resolves.toEqual(localResult);

    expect(workerApi.syncState).toHaveBeenCalledWith(state);
    expect(localSyncState).toHaveBeenCalledWith(state);
    expect(localAnalyze).toHaveBeenCalledWith({ q: 2, r: 0 });
    expect(workerInstances[0]?.terminate).toHaveBeenCalledTimes(1);

    await source.dispose();
    expect(localDispose).toHaveBeenCalledTimes(1);
  });
});
