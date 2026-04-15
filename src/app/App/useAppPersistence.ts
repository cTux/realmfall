import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  createFreshLogsAtTime,
  type GameState,
  type LogKind,
} from '../../game/state';
import {
  loadEncryptedState,
  type PersistedData,
  saveEncryptedState,
} from '../../persistence/storage';
import {
  DEFAULT_LOG_FILTERS,
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import { normalizeLoadedGame } from '../normalize';
import type { PersistedUiState } from './types';

const AUTOSAVE_DEBOUNCE_MS = 300;
const AUTOSAVE_INTERVAL_MS = 5000;

type PersistedSaveSegments = {
  game: PersistedData['game'];
  ui: PersistedData['ui'];
};

type SerializedSaveSegments = {
  game: string | null;
  ui: string | null;
};

type DirtySaveSegments = {
  game: boolean;
  ui: boolean;
};

interface UseAppPersistenceOptions {
  game: GameState;
  gameRef: MutableRefObject<GameState>;
  logFilters: Record<LogKind, boolean>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setLogFilters: Dispatch<SetStateAction<Record<LogKind, boolean>>>;
  setWindows: Dispatch<SetStateAction<WindowPositions>>;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  setWorldTimeMs: Dispatch<SetStateAction<number>>;
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
}

function buildPersistedGameSnapshot({
  game,
  worldTimeMs,
}: {
  game: GameState;
  worldTimeMs: number;
}) {
  return { ...game, worldTimeMs, logs: [] };
}

function buildPersistedUiSnapshot({
  logFilters,
  windowShown,
  windows,
}: {
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
}) {
  return { windows, windowShown, logFilters };
}

function buildPersistedSnapshot(
  segments: PersistedSaveSegments,
): PersistedData {
  return {
    game: segments.game,
    ui: segments.ui,
  };
}

function serializeSegment(
  segment: PersistedSaveSegments[keyof PersistedSaveSegments],
) {
  return JSON.stringify(segment);
}

function clearDebounceTimer(debounceTimerRef: MutableRefObject<number | null>) {
  if (debounceTimerRef.current !== null) {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }
}

interface PersistSnapshotResult {
  error?: unknown;
  succeeded: boolean;
}

function enqueuePersistSnapshot({
  currentSerializedRef,
  dirtySegmentsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
  serialized,
  snapshot,
}: {
  currentSerializedRef: MutableRefObject<SerializedSaveSegments>;
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
  serialized: SerializedSaveSegments;
  snapshot: PersistedData;
}) {
  const queuedSave = saveQueueRef.current.then(async () => {
    saveInFlightRef.current = true;

    try {
      await saveEncryptedState(snapshot);
      lastSavedSerializedRef.current = { ...serialized };

      return { succeeded: true } satisfies PersistSnapshotResult;
    } catch (error) {
      return { error, succeeded: false } satisfies PersistSnapshotResult;
    } finally {
      dirtySegmentsRef.current = {
        game:
          currentSerializedRef.current.game !==
          lastSavedSerializedRef.current.game,
        ui:
          currentSerializedRef.current.ui !== lastSavedSerializedRef.current.ui,
      };
      saveInFlightRef.current = false;
    }
  });

  saveQueueRef.current = queuedSave.then(() => undefined);

  return queuedSave;
}

function flushPendingSave({
  currentSerializedRef,
  dirtySegmentsRef,
  latestSegmentsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  currentSerializedRef: MutableRefObject<SerializedSaveSegments>;
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestSegmentsRef: MutableRefObject<PersistedSaveSegments>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (saveInFlightRef.current) return;
  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    return;
  }

  const nextSerialized = {
    game: currentSerializedRef.current.game,
    ui: currentSerializedRef.current.ui,
  };

  void enqueuePersistSnapshot({
    currentSerializedRef,
    dirtySegmentsRef,
    lastSavedSerializedRef,
    saveInFlightRef,
    saveQueueRef,
    serialized: nextSerialized,
    snapshot: buildPersistedSnapshot(latestSegmentsRef.current),
  }).then((result) => {
    if (
      result.succeeded &&
      (dirtySegmentsRef.current.game || dirtySegmentsRef.current.ui)
    ) {
      flushPendingSave({
        currentSerializedRef,
        dirtySegmentsRef,
        latestSegmentsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }
  });
}

function scheduleSave({
  debounceTimerRef,
  currentSerializedRef,
  dirtySegmentsRef,
  latestSegmentsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
  nextGameSegment,
  nextUiSegment,
}: {
  debounceTimerRef: MutableRefObject<number | null>;
  currentSerializedRef: MutableRefObject<SerializedSaveSegments>;
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestSegmentsRef: MutableRefObject<PersistedSaveSegments>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
  nextGameSegment?: string;
  nextUiSegment?: string;
}) {
  if (nextGameSegment !== undefined) {
    currentSerializedRef.current.game = nextGameSegment;
    dirtySegmentsRef.current.game =
      nextGameSegment !== lastSavedSerializedRef.current.game;
  }

  if (nextUiSegment !== undefined) {
    currentSerializedRef.current.ui = nextUiSegment;
    dirtySegmentsRef.current.ui =
      nextUiSegment !== lastSavedSerializedRef.current.ui;
  }

  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    clearDebounceTimer(debounceTimerRef);
    return;
  }

  clearDebounceTimer(debounceTimerRef);
  debounceTimerRef.current = window.setTimeout(() => {
    debounceTimerRef.current = null;
    flushPendingSave({
      currentSerializedRef,
      dirtySegmentsRef,
      latestSegmentsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, AUTOSAVE_DEBOUNCE_MS);
}

export function useAppPersistence({
  game,
  gameRef,
  logFilters,
  setGame,
  setLogFilters,
  setWindows,
  setWindowShown,
  setWorldTimeMs,
  windows,
  windowShown,
  worldTimeMsRef,
  worldTimeTickRef,
  lastDisplayedWorldSecondRef,
}: UseAppPersistenceOptions) {
  const [hydrated, setHydrated] = useState(false);
  const latestSegmentsRef = useRef<PersistedSaveSegments>({
    game: buildPersistedGameSnapshot({
      game,
      worldTimeMs: worldTimeMsRef.current,
    }),
    ui: buildPersistedUiSnapshot({
      logFilters,
      windowShown,
      windows,
    }),
  });
  const currentSerializedRef = useRef<SerializedSaveSegments>({
    game: serializeSegment(latestSegmentsRef.current.game),
    ui: serializeSegment(latestSegmentsRef.current.ui),
  });
  const lastSavedSerializedRef = useRef<SerializedSaveSegments>({
    game: null,
    ui: null,
  });
  const dirtySegmentsRef = useRef<DirtySaveSegments>({
    game: false,
    ui: false,
  });
  const debounceTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;

      const snapshotUi = saved?.ui as
        | (PersistedUiState & {
            windows?: WindowPositions;
            windowShown?: WindowVisibilityState;
            windowCollapsed?: Partial<WindowVisibilityState>;
          })
        | undefined;
      const hydratedWindows = snapshotUi?.windows
        ? { ...DEFAULT_WINDOWS, ...snapshotUi.windows }
        : DEFAULT_WINDOWS;
      const hydratedWindowShown = snapshotUi?.windowShown
        ? {
            ...DEFAULT_WINDOW_VISIBILITY,
            ...snapshotUi.windowShown,
          }
        : snapshotUi?.windowCollapsed
          ? ({
              ...DEFAULT_WINDOW_VISIBILITY,
              ...Object.fromEntries(
                Object.entries(snapshotUi.windowCollapsed).map(
                  ([key, collapsed]) => [key, !collapsed],
                ),
              ),
            } as WindowVisibilityState)
          : DEFAULT_WINDOW_VISIBILITY;
      const hydratedLogFilters = snapshotUi?.logFilters
        ? { ...DEFAULT_LOG_FILTERS, ...snapshotUi.logFilters }
        : DEFAULT_LOG_FILTERS;
      if (saved?.game) {
        const loadedGame = normalizeLoadedGame(saved.game as GameState);
        worldTimeMsRef.current = loadedGame.worldTimeMs;
        worldTimeTickRef.current = null;
        lastDisplayedWorldSecondRef.current = Math.floor(
          loadedGame.worldTimeMs / 1000,
        );
        setWorldTimeMs(loadedGame.worldTimeMs);
        setGame({
          ...loadedGame,
          logSequence: 3,
          logs: createFreshLogsAtTime(loadedGame.seed, loadedGame.worldTimeMs),
        });
        latestSegmentsRef.current.game = buildPersistedGameSnapshot({
          game: loadedGame,
          worldTimeMs: loadedGame.worldTimeMs,
        });
      }

      if (saved?.ui) {
        if (snapshotUi?.windows) setWindows(hydratedWindows);
        if (snapshotUi?.windowShown || snapshotUi?.windowCollapsed) {
          setWindowShown(hydratedWindowShown);
        }
        if (snapshotUi?.logFilters) {
          setLogFilters((current) => ({
            ...current,
            ...snapshotUi.logFilters,
          }));
        }
      }

      latestSegmentsRef.current.ui = buildPersistedUiSnapshot({
        logFilters: hydratedLogFilters,
        windowShown: hydratedWindowShown,
        windows: hydratedWindows,
      });
      if (saved?.game || saved?.ui) {
        const serialized = {
          game: serializeSegment(latestSegmentsRef.current.game),
          ui: serializeSegment(latestSegmentsRef.current.ui),
        };
        currentSerializedRef.current = { ...serialized };
        lastSavedSerializedRef.current = { ...serialized };
        dirtySegmentsRef.current = {
          game: false,
          ui: false,
        };
      }

      setHydrated(true);
    });

    return () => {
      alive = false;
    };
  }, [
    lastDisplayedWorldSecondRef,
    setGame,
    setLogFilters,
    setWindowShown,
    setWindows,
    setWorldTimeMs,
    worldTimeMsRef,
    worldTimeTickRef,
  ]);

  useEffect(() => {
    if (!hydrated) return;

    const nextGameSnapshot = buildPersistedGameSnapshot({
      game,
      worldTimeMs: worldTimeMsRef.current,
    });
    latestSegmentsRef.current.game = nextGameSnapshot;
    scheduleSave({
      debounceTimerRef,
      currentSerializedRef,
      dirtySegmentsRef,
      latestSegmentsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
      nextGameSegment: serializeSegment(nextGameSnapshot),
    });
  }, [game, hydrated, worldTimeMsRef]);

  useEffect(() => {
    if (!hydrated) return;

    const nextUiSnapshot = buildPersistedUiSnapshot({
      logFilters,
      windowShown,
      windows,
    });
    latestSegmentsRef.current.ui = nextUiSnapshot;
    scheduleSave({
      debounceTimerRef,
      currentSerializedRef,
      dirtySegmentsRef,
      latestSegmentsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
      nextUiSegment: serializeSegment(nextUiSnapshot),
    });
  }, [hydrated, logFilters, windowShown, windows]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      flushPendingSave({
        currentSerializedRef,
        dirtySegmentsRef,
        latestSegmentsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearDebounceTimer(debounceTimerRef);
    };
  }, [hydrated]);

  const persistNow = async () => {
    clearDebounceTimer(debounceTimerRef);

    const nextGameSnapshot = buildPersistedGameSnapshot({
      game: gameRef.current,
      worldTimeMs: worldTimeMsRef.current,
    });
    const nextUiSnapshot = buildPersistedUiSnapshot({
      logFilters,
      windowShown,
      windows,
    });

    latestSegmentsRef.current = {
      game: nextGameSnapshot,
      ui: nextUiSnapshot,
    };

    const serialized = {
      game: serializeSegment(nextGameSnapshot),
      ui: serializeSegment(nextUiSnapshot),
    };

    currentSerializedRef.current = { ...serialized };
    dirtySegmentsRef.current = {
      game: serialized.game !== lastSavedSerializedRef.current.game,
      ui: serialized.ui !== lastSavedSerializedRef.current.ui,
    };

    const result = await enqueuePersistSnapshot({
      currentSerializedRef,
      dirtySegmentsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
      serialized,
      snapshot: buildPersistedSnapshot(latestSegmentsRef.current),
    });

    if (!result.succeeded) {
      throw result.error;
    }
  };

  return { hydrated, persistNow };
}
