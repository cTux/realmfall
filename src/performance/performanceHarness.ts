import type { SceneRenderCounts } from '../ui/world/renderSceneCache';

export type RealmfallPerformancePhase = 'mount' | 'nested-update' | 'update';

export interface StartupMark {
  name: string;
  startTime: number;
}

export interface ReactCommit {
  actualDuration: number;
  commitTime: number;
  id: string;
  phase: RealmfallPerformancePhase;
  startTime: number;
}

export interface ObservedPerformanceEntry {
  duration: number;
  entryType: string;
  name: string;
  startTime: number;
}

export interface PerformanceScenario {
  duration: number;
  label: string;
  longAnimationFrameCount: number;
  longTaskCount: number;
  pixiRenderCounts: SceneRenderCounts | null;
  reactCommitCount: number;
  startTime: number;
}

export interface RealmfallPerformanceSnapshot {
  longAnimationFrames: ObservedPerformanceEntry[];
  longTasks: ObservedPerformanceEntry[];
  pixiRenderCounts: SceneRenderCounts | null;
  reactCommits: ReactCommit[];
  scenarios: PerformanceScenario[];
  startupMarks: StartupMark[];
}

export interface RealmfallPerformanceHarness {
  endScenario: (label: string) => void;
  recordPixiRenderCounts: (counts: SceneRenderCounts) => void;
  recordReactCommit: (
    id: string,
    phase: RealmfallPerformancePhase,
    actualDuration: number,
    startTime: number,
    commitTime: number,
  ) => void;
  recordStartupMark: (name: string, startTime?: number) => void;
  reset: () => void;
  snapshot: () => RealmfallPerformanceSnapshot;
  startScenario: (label: string) => void;
}

interface ActiveScenario {
  longAnimationFrameStartIndex: number;
  longTaskStartIndex: number;
  reactCommitStartIndex: number;
  startTime: number;
}

export interface InstallPerformanceHarnessOptions {
  force?: boolean;
}

const PERF_QUERY_PARAM = 'perf';
const PERF_QUERY_PARAM_ALIAS = 'realmfallPerf';
const PERF_STORAGE_KEY = 'realmfall:perf';
const MAX_REACT_COMMITS = 400;
const MAX_OBSERVED_ENTRIES = 200;
const MAX_STARTUP_MARKS = 80;
const MAX_SCENARIOS = 120;
const HARNESS_MARK_PREFIX = 'realmfall:';

declare global {
  interface Window {
    __REALMFALL_PERF__?: RealmfallPerformanceHarness;
  }
}

export function shouldEnablePerformanceHarness(
  search = readWindowSearch(),
  stored = readStoredPreference(),
) {
  const params = new URLSearchParams(search);

  return (
    params.get(PERF_QUERY_PARAM) === '1' ||
    params.get(PERF_QUERY_PARAM_ALIAS) === '1' ||
    stored === '1'
  );
}

export function installPerformanceHarness(
  options: InstallPerformanceHarnessOptions = {},
): RealmfallPerformanceHarness | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.__REALMFALL_PERF__) {
    return window.__REALMFALL_PERF__;
  }

  if (!options.force && !shouldEnablePerformanceHarness()) {
    return null;
  }

  const startupMarks: StartupMark[] = [];
  const reactCommits: ReactCommit[] = [];
  const longAnimationFrames: ObservedPerformanceEntry[] = [];
  const longTasks: ObservedPerformanceEntry[] = [];
  const scenarios: PerformanceScenario[] = [];
  const activeScenarios = new Map<string, ActiveScenario>();
  let pixiRenderCounts: SceneRenderCounts | null = null;

  const recordObservedEntry = (
    target: ObservedPerformanceEntry[],
    entry: PerformanceEntry,
  ) => {
    pushCapped(
      target,
      {
        duration: entry.duration,
        entryType: entry.entryType,
        name: entry.name,
        startTime: entry.startTime,
      },
      MAX_OBSERVED_ENTRIES,
    );
  };

  const observers = [
    observePerformanceEntryType('long-animation-frame', (entry) =>
      recordObservedEntry(longAnimationFrames, entry),
    ),
    observePerformanceEntryType('longtask', (entry) =>
      recordObservedEntry(longTasks, entry),
    ),
  ].filter((observer) => observer !== null);

  const harness: RealmfallPerformanceHarness = {
    endScenario(label) {
      const activeScenario = activeScenarios.get(label);
      if (!activeScenario) {
        return;
      }

      activeScenarios.delete(label);
      const endTime = getPerformanceNow();
      pushCapped(
        scenarios,
        {
          duration: endTime - activeScenario.startTime,
          label,
          longAnimationFrameCount:
            longAnimationFrames.length -
            activeScenario.longAnimationFrameStartIndex,
          longTaskCount: longTasks.length - activeScenario.longTaskStartIndex,
          pixiRenderCounts: copySceneRenderCounts(pixiRenderCounts),
          reactCommitCount:
            reactCommits.length - activeScenario.reactCommitStartIndex,
          startTime: activeScenario.startTime,
        },
        MAX_SCENARIOS,
      );
    },
    recordPixiRenderCounts(counts) {
      pixiRenderCounts = copySceneRenderCounts(counts);
    },
    recordReactCommit(id, phase, actualDuration, startTime, commitTime) {
      pushCapped(
        reactCommits,
        {
          actualDuration,
          commitTime,
          id,
          phase,
          startTime,
        },
        MAX_REACT_COMMITS,
      );
    },
    recordStartupMark(name, startTime = getPerformanceNow()) {
      try {
        window.performance?.mark(`${HARNESS_MARK_PREFIX}${name}`, {
          startTime,
        });
      } catch {
        // Browser performance marks are diagnostic only.
      }

      pushCapped(startupMarks, { name, startTime }, MAX_STARTUP_MARKS);
    },
    reset() {
      startupMarks.length = 0;
      reactCommits.length = 0;
      longAnimationFrames.length = 0;
      longTasks.length = 0;
      scenarios.length = 0;
      activeScenarios.clear();
      pixiRenderCounts = null;
    },
    snapshot() {
      return {
        longAnimationFrames: longAnimationFrames.map(copyObservedEntry),
        longTasks: longTasks.map(copyObservedEntry),
        pixiRenderCounts: copySceneRenderCounts(pixiRenderCounts),
        reactCommits: reactCommits.map((commit) => ({ ...commit })),
        scenarios: scenarios.map((scenario) => ({
          ...scenario,
          pixiRenderCounts: copySceneRenderCounts(scenario.pixiRenderCounts),
        })),
        startupMarks: startupMarks.map((mark) => ({ ...mark })),
      };
    },
    startScenario(label) {
      activeScenarios.set(label, {
        longAnimationFrameStartIndex: longAnimationFrames.length,
        longTaskStartIndex: longTasks.length,
        reactCommitStartIndex: reactCommits.length,
        startTime: getPerformanceNow(),
      });
    },
  };

  window.__REALMFALL_PERF__ = harness;

  window.addEventListener(
    'pagehide',
    () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    },
    { once: true },
  );

  return harness;
}

export const isPerformanceHarnessActive = () =>
  typeof window !== 'undefined' && window.__REALMFALL_PERF__ !== undefined;

export function recordStartupMark(name: string, startTime?: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.__REALMFALL_PERF__?.recordStartupMark(name, startTime);
}

export function recordReactCommit(
  id: string,
  phase: RealmfallPerformancePhase,
  actualDuration: number,
  startTime: number,
  commitTime: number,
) {
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

export function recordPixiRenderCounts(counts: SceneRenderCounts) {
  if (typeof window === 'undefined') {
    return;
  }

  window.__REALMFALL_PERF__?.recordPixiRenderCounts(counts);
}

function readWindowSearch() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.search;
}

function readStoredPreference() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(PERF_STORAGE_KEY);
  } catch {
    return null;
  }
}

function observePerformanceEntryType(
  entryType: string,
  onEntry: (entry: PerformanceEntry) => void,
) {
  if (
    typeof window === 'undefined' ||
    typeof window.PerformanceObserver !== 'function' ||
    !window.PerformanceObserver.supportedEntryTypes.includes(entryType)
  ) {
    return null;
  }

  const observer = new window.PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      onEntry(entry);
    }
  });

  try {
    observer.observe({ buffered: true, type: entryType });
  } catch {
    return null;
  }

  return observer;
}

function getPerformanceNow() {
  if (typeof window === 'undefined') {
    return Date.now();
  }

  return window.performance?.now() ?? Date.now();
}

function copyObservedEntry(entry: ObservedPerformanceEntry) {
  return { ...entry };
}

function copySceneRenderCounts(counts: SceneRenderCounts | null) {
  return counts ? { ...counts } : null;
}

function pushCapped<T>(target: T[], item: T, maxSize: number) {
  target.push(item);
  if (target.length > maxSize) {
    target.splice(0, target.length - maxSize);
  }
}
