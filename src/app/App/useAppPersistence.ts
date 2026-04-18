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

const AUTOSAVE_INTERVAL_MS = 5000;
const AUTOSAVE_DEBOUNCE_MS = AUTOSAVE_INTERVAL_MS;

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

type LatestSaveInputs = {
  game: GameState;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
  worldTimeMs: number;
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

function buildPersistedSegments(
  latestInputs: LatestSaveInputs,
): PersistedSaveSegments {
  return {
    game: buildPersistedGameSnapshot({
      game: latestInputs.game,
      worldTimeMs: latestInputs.worldTimeMs,
    }),
    ui: buildPersistedUiSnapshot({
      logFilters: latestInputs.logFilters,
      windowShown: latestInputs.windowShown,
      windows: latestInputs.windows,
    }),
  };
}

function serializeSegment(
  segment: PersistedSaveSegments[keyof PersistedSaveSegments],
) {
  return JSON.stringify(segment);
}

function serializeSegments(
  segments: PersistedSaveSegments,
): SerializedSaveSegments {
  return {
    game: serializeSegment(segments.game),
    ui: serializeSegment(segments.ui),
  };
}

function getDirtySegments(
  serialized: SerializedSaveSegments,
  lastSavedSerialized: SerializedSaveSegments,
): DirtySaveSegments {
  return {
    game: serialized.game !== lastSavedSerialized.game,
    ui: serialized.ui !== lastSavedSerialized.ui,
  };
}

function clearDebounceTimer(debounceTimerRef: MutableRefObject<number | null>) {
  if (debounceTimerRef.current !== null) {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }
}

function clearDebounceSchedule(
  debounceDueAtRef: MutableRefObject<number | null>,
  debounceTimerRef: MutableRefObject<number | null>,
) {
  debounceDueAtRef.current = null;
  clearDebounceTimer(debounceTimerRef);
}

interface PersistSnapshotResult {
  error?: unknown;
  succeeded: boolean;
}

function enqueuePersistSnapshot({
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
  serialized,
  snapshot,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
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
      dirtySegmentsRef.current = getDirtySegments(
        serializeSegments(buildPersistedSegments(latestInputsRef.current)),
        lastSavedSerializedRef.current,
      );
      saveInFlightRef.current = false;
    }
  });

  saveQueueRef.current = queuedSave.then(() => undefined);

  return queuedSave;
}

function flushPendingSave({
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (saveInFlightRef.current) return;
  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    return;
  }

  const nextSegments = buildPersistedSegments(latestInputsRef.current);
  const nextSerialized = serializeSegments(nextSegments);
  const nextDirtySegments = getDirtySegments(
    nextSerialized,
    lastSavedSerializedRef.current,
  );
  if (!nextDirtySegments.game && !nextDirtySegments.ui) {
    dirtySegmentsRef.current = nextDirtySegments;
    return;
  }

  void enqueuePersistSnapshot({
    dirtySegmentsRef,
    latestInputsRef,
    lastSavedSerializedRef,
    saveInFlightRef,
    saveQueueRef,
    serialized: nextSerialized,
    snapshot: buildPersistedSnapshot(nextSegments),
  }).then((result) => {
    if (
      result.succeeded &&
      (dirtySegmentsRef.current.game || dirtySegmentsRef.current.ui)
    ) {
      flushPendingSave({
        dirtySegmentsRef,
        latestInputsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }
  });
}

function scheduleSave({
  debounceTimerRef,
  debounceDueAtRef,
  dirtySegmentsRef,
  latestInputsRef,
  lastSavedSerializedRef,
  saveInFlightRef,
  saveQueueRef,
}: {
  debounceTimerRef: MutableRefObject<number | null>;
  debounceDueAtRef: MutableRefObject<number | null>;
  dirtySegmentsRef: MutableRefObject<DirtySaveSegments>;
  latestInputsRef: MutableRefObject<LatestSaveInputs>;
  lastSavedSerializedRef: MutableRefObject<SerializedSaveSegments>;
  saveInFlightRef: MutableRefObject<boolean>;
  saveQueueRef: MutableRefObject<Promise<void>>;
}) {
  if (!dirtySegmentsRef.current.game && !dirtySegmentsRef.current.ui) {
    clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
    return;
  }

  clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
  debounceDueAtRef.current = Date.now() + AUTOSAVE_DEBOUNCE_MS;
  debounceTimerRef.current = window.setTimeout(() => {
    debounceDueAtRef.current = null;
    debounceTimerRef.current = null;
    flushPendingSave({
      dirtySegmentsRef,
      latestInputsRef,
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
  const latestInputsRef = useRef<LatestSaveInputs>({
    game,
    logFilters,
    windowShown,
    windows,
    worldTimeMs: worldTimeMsRef.current,
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
  const debounceDueAtRef = useRef<number | null>(null);
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
        latestInputsRef.current.game = loadedGame;
        latestInputsRef.current.worldTimeMs = loadedGame.worldTimeMs;
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

      latestInputsRef.current.logFilters = hydratedLogFilters;
      latestInputsRef.current.windowShown = hydratedWindowShown;
      latestInputsRef.current.windows = hydratedWindows;
      if (saved?.game || saved?.ui) {
        const serialized = serializeSegments(
          buildPersistedSegments(latestInputsRef.current),
        );
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

    latestInputsRef.current.game = game;
    latestInputsRef.current.worldTimeMs = worldTimeMsRef.current;
    dirtySegmentsRef.current.game = true;
    scheduleSave({
      debounceDueAtRef,
      debounceTimerRef,
      dirtySegmentsRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, [game, hydrated, worldTimeMsRef]);

  useEffect(() => {
    if (!hydrated) return;

    latestInputsRef.current.logFilters = logFilters;
    latestInputsRef.current.windowShown = windowShown;
    latestInputsRef.current.windows = windows;
    dirtySegmentsRef.current.ui = true;
    scheduleSave({
      debounceDueAtRef,
      debounceTimerRef,
      dirtySegmentsRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, [hydrated, logFilters, windowShown, windows]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      if (
        debounceDueAtRef.current !== null &&
        debounceDueAtRef.current <= Date.now()
      ) {
        return;
      }

      flushPendingSave({
        dirtySegmentsRef,
        latestInputsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
    };
  }, [hydrated]);

  const persistNow = async () => {
    clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);

    latestInputsRef.current = {
      game: gameRef.current,
      logFilters,
      windowShown,
      windows,
      worldTimeMs: worldTimeMsRef.current,
    };

    const nextSegments = buildPersistedSegments(latestInputsRef.current);
    const serialized = serializeSegments(nextSegments);

    dirtySegmentsRef.current = getDirtySegments(
      serialized,
      lastSavedSerializedRef.current,
    );

    const result = await enqueuePersistSnapshot({
      dirtySegmentsRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
      serialized,
      snapshot: buildPersistedSnapshot(nextSegments),
    });

    if (!result.succeeded) {
      throw result.error;
    }
  };

  return { hydrated, persistNow };
}
