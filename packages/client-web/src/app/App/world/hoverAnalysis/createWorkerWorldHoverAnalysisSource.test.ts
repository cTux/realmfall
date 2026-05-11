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

  it('syncs to the active worker backend only', async () => {
    const state = {
      combat: null,
      enemies: {},
      gameOver: false,
      player: { coord: { q: 0, r: 0 } },
      radius: 3,
      revealRadius: 4,
      tiles: {},
    };

    const workerResult = {
      actionable: true,
      safePath: null,
    };

    const workerAnalyze = vi.fn(async () => workerResult);
    const workerSyncState = vi.fn(async () => undefined);
    const workerApi = {
      analyze: workerAnalyze,
      syncState: workerSyncState,
    };
    wrap.mockReturnValue(workerApi);

    const localAnalyze = vi.fn(async () => workerResult);
    const localSyncState = vi.fn(async () => undefined);
    const localDispose = vi.fn(async () => undefined);
    createLocalWorldHoverAnalysisSource.mockReturnValue({
      analyze: localAnalyze,
      dispose: localDispose,
      syncState: localSyncState,
    });

    const { createWorkerWorldHoverAnalysisSource } =
      await import('./createWorkerWorldHoverAnalysisSourceTestkit');
    const source = createWorkerWorldHoverAnalysisSource();

    await source.syncState(state);

    await expect(source.analyze({ q: 2, r: 0 })).resolves.toEqual(workerResult);

    expect(workerSyncState).toHaveBeenCalledWith(state);
    expect(localSyncState).not.toHaveBeenCalled();
    expect(localAnalyze).not.toHaveBeenCalled();

    await source.dispose();
    expect(localDispose).toHaveBeenCalledTimes(1);
  });

  it('replays latest synced state to local fallback when worker analysis fails', async () => {
    const firstState = {
      combat: null,
      enemies: {},
      gameOver: false,
      player: { coord: { q: 0, r: 0 } },
      radius: 3,
      revealRadius: 4,
      tiles: {},
    };
    const secondState = {
      combat: null,
      enemies: {
        enemyId: {
          coord: { q: 3, r: 0 },
          defense: 1,
          elite: false,
          attack: 1,
          hp: 5,
          id: 'enemyId',
          maxHp: 5,
          name: 'Enemy',
          tier: 1,
          xp: 0,
        },
      },
      gameOver: false,
      player: { coord: { q: 1, r: 0 } },
      radius: 4,
      revealRadius: 4,
      tiles: {},
    };
    const fallbackResult = {
      actionable: true,
      safePath: [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    };

    let localSyncedState = firstState;
    const localAnalyze = vi.fn(async () => {
      if (localSyncedState !== secondState) {
        throw new Error('local cache was not replayed on fallback');
      }

      return fallbackResult;
    });
    const localSyncState = vi.fn(async (state: typeof firstState) => {
      localSyncedState = state;
    });
    const localDispose = vi.fn(async () => undefined);

    const workerApi = {
      analyze: vi.fn(async () => {
        throw new Error('worker analyze failed');
      }),
      syncState: vi.fn(async () => undefined),
    };
    wrap.mockReturnValue(workerApi);

    createLocalWorldHoverAnalysisSource.mockReturnValue({
      analyze: localAnalyze,
      dispose: localDispose,
      syncState: localSyncState,
    });

    const { createWorkerWorldHoverAnalysisSource } =
      await import('./createWorkerWorldHoverAnalysisSourceTestkit');
    const source = createWorkerWorldHoverAnalysisSource();

    await source.syncState(firstState);
    await source.syncState(secondState);

    await expect(source.analyze({ q: 2, r: 0 })).resolves.toEqual(
      fallbackResult,
    );

    expect(workerApi.syncState).toHaveBeenCalledTimes(2);
    expect(workerApi.syncState).toHaveBeenNthCalledWith(1, firstState);
    expect(workerApi.syncState).toHaveBeenNthCalledWith(2, secondState);
    expect(localSyncState).toHaveBeenCalledTimes(1);
    expect(localSyncState).toHaveBeenCalledWith(secondState);
    expect(workerInstances[0]?.terminate).toHaveBeenCalledTimes(1);
    expect(localAnalyze).toHaveBeenCalledWith({ q: 2, r: 0 });
    expect(workerApi.analyze).toHaveBeenCalledWith({ q: 2, r: 0 });

    await source.dispose();
    expect(localDispose).toHaveBeenCalledTimes(1);
  });
});
