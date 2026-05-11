import type { SceneRenderCounts } from '../ui/world/renderSceneCache';

type RealmfallPerformancePhase = 'mount' | 'nested-update' | 'update';

export function isPerformanceHarnessActive(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.__REALMFALL_PERF__ !== undefined &&
    window.__REALMFALL_PERF__ !== null
  );
}

export function recordPixiRenderCounts(counts: SceneRenderCounts): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__REALMFALL_PERF__?.recordPixiRenderCounts(counts);
}

export function recordReactCommit(
  id: string,
  phase: RealmfallPerformancePhase,
  actualDuration: number,
  startTime: number,
  commitTime: number,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__REALMFALL_PERF__?.recordReactCommit(
    id,
    phase,
    actualDuration,
    startTime,
    commitTime,
  );
}

export function recordStartupMark(name: string, startTime?: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__REALMFALL_PERF__?.recordStartupMark(name, startTime);
}
