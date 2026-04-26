import {
  installPerformanceHarness,
  recordPixiRenderCounts,
  recordReactCommit,
  recordStartupMark,
  shouldEnablePerformanceHarness,
} from './performanceHarness';

describe('performanceHarness', () => {
  afterEach(() => {
    delete window.__REALMFALL_PERF__;
    window.localStorage.clear();
  });

  it('enables from query params or local storage', () => {
    expect(shouldEnablePerformanceHarness('?perf=1', null)).toBe(true);
    expect(shouldEnablePerformanceHarness('?realmfallPerf=1', null)).toBe(true);
    expect(shouldEnablePerformanceHarness('', '1')).toBe(true);
    expect(shouldEnablePerformanceHarness('', null)).toBe(false);
  });

  it('records startup marks, React commits, Pixi counts, and scenarios', () => {
    const harness = installPerformanceHarness({ force: true });

    expect(harness).not.toBeNull();

    recordStartupMark('main-start', 2);
    recordReactCommit('App', 'mount', 4, 1, 8);
    recordPixiRenderCounts({
      animated: 1,
      interaction: 1,
      static: 1,
      total: 1,
    });
    harness?.startScenario('window-toggle');
    harness?.endScenario('window-toggle');

    expect(window.__REALMFALL_PERF__?.snapshot()).toMatchObject({
      pixiRenderCounts: {
        animated: 1,
        interaction: 1,
        static: 1,
        total: 1,
      },
      reactCommits: [
        {
          actualDuration: 4,
          commitTime: 8,
          id: 'App',
          phase: 'mount',
          startTime: 1,
        },
      ],
      scenarios: [
        {
          label: 'window-toggle',
        },
      ],
      startupMarks: [
        {
          name: 'main-start',
          startTime: 2,
        },
      ],
    });
  });
});
