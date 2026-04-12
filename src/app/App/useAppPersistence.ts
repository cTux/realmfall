import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import {
  createFreshLogs,
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

type PendingSave = {
  data: PersistedData;
  serialized: string;
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

function buildPersistedSnapshot({
  game,
  logFilters,
  windowShown,
  windows,
  worldTimeMs,
}: {
  game: GameState;
  logFilters: Record<LogKind, boolean>;
  windowShown: WindowVisibilityState;
  windows: WindowPositions;
  worldTimeMs: number;
}): PersistedData {
  return {
    game: { ...game, worldTimeMs, logs: [] },
    ui: { windows, windowShown, logFilters },
  };
}

function serializePersistedSnapshot(snapshot: PersistedData) {
  return JSON.stringify(snapshot);
}

function clearDebounceTimer(debounceTimerRef: MutableRefObject<number | null>) {
  if (debounceTimerRef.current !== null) {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }
}

function flushPendingSave({
  lastSavedSnapshotRef,
  pendingSaveRef,
  saveInFlightRef,
}: {
  lastSavedSnapshotRef: MutableRefObject<string | null>;
  pendingSaveRef: MutableRefObject<PendingSave | null>;
  saveInFlightRef: MutableRefObject<boolean>;
}) {
  if (saveInFlightRef.current) return;

  const pendingSave = pendingSaveRef.current;
  if (!pendingSave) return;

  if (pendingSave.serialized === lastSavedSnapshotRef.current) {
    pendingSaveRef.current = null;
    return;
  }

  pendingSaveRef.current = null;
  saveInFlightRef.current = true;

  void Promise.resolve(saveEncryptedState(pendingSave.data))
    .then(() => {
      lastSavedSnapshotRef.current = pendingSave.serialized;
    })
    .finally(() => {
      saveInFlightRef.current = false;
      if (
        pendingSaveRef.current &&
        pendingSaveRef.current.serialized !== lastSavedSnapshotRef.current
      ) {
        flushPendingSave({
          lastSavedSnapshotRef,
          pendingSaveRef,
          saveInFlightRef,
        });
      }
    });
}

function scheduleSave({
  debounceTimerRef,
  lastSavedSnapshotRef,
  pendingSaveRef,
  saveInFlightRef,
  snapshot,
}: {
  debounceTimerRef: MutableRefObject<number | null>;
  lastSavedSnapshotRef: MutableRefObject<string | null>;
  pendingSaveRef: MutableRefObject<PendingSave | null>;
  saveInFlightRef: MutableRefObject<boolean>;
  snapshot: PersistedData;
}) {
  const serialized = serializePersistedSnapshot(snapshot);

  if (serialized === lastSavedSnapshotRef.current) {
    pendingSaveRef.current = null;
    clearDebounceTimer(debounceTimerRef);
    return;
  }

  pendingSaveRef.current = { data: snapshot, serialized };
  clearDebounceTimer(debounceTimerRef);
  debounceTimerRef.current = window.setTimeout(() => {
    debounceTimerRef.current = null;
    flushPendingSave({
      lastSavedSnapshotRef,
      pendingSaveRef,
      saveInFlightRef,
    });
  }, AUTOSAVE_DEBOUNCE_MS);
}

export function useAppPersistence({
  game,
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
  const pendingSaveRef = useRef<PendingSave | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;

      if (saved?.game) {
        const loadedGame = normalizeLoadedGame(saved.game as GameState);
        const snapshotGame = { ...loadedGame, logs: [] };
        worldTimeMsRef.current = loadedGame.worldTimeMs;
        worldTimeTickRef.current = null;
        lastDisplayedWorldSecondRef.current = Math.floor(
          loadedGame.worldTimeMs / 1000,
        );
        setWorldTimeMs(loadedGame.worldTimeMs);
        setGame({
          ...loadedGame,
          logSequence: 3,
          logs: createFreshLogs(loadedGame.seed),
        });

        const snapshotUi = saved.ui as
          | ({
              windows?: WindowPositions;
              windowShown?: WindowVisibilityState;
              windowCollapsed?: Partial<WindowVisibilityState>;
            } & PersistedUiState)
          | undefined;
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
        lastSavedSnapshotRef.current = serializePersistedSnapshot(
          buildPersistedSnapshot({
            game: snapshotGame,
            logFilters: snapshotUi?.logFilters
              ? { ...DEFAULT_LOG_FILTERS, ...snapshotUi.logFilters }
              : DEFAULT_LOG_FILTERS,
            windowShown: hydratedWindowShown,
            windows: snapshotUi?.windows
              ? { ...DEFAULT_WINDOWS, ...snapshotUi.windows }
              : DEFAULT_WINDOWS,
            worldTimeMs: loadedGame.worldTimeMs,
          }),
        );
      }

      if (saved?.ui) {
        const ui = saved.ui as {
          windows?: WindowPositions;
          windowShown?: WindowVisibilityState;
          windowCollapsed?: Partial<WindowVisibilityState>;
        } & PersistedUiState;

        if (ui.windows) setWindows({ ...DEFAULT_WINDOWS, ...ui.windows });
        if (ui.windowShown) {
          setWindowShown({
            ...DEFAULT_WINDOW_VISIBILITY,
            ...ui.windowShown,
          });
        } else if (ui.windowCollapsed) {
          setWindowShown({
            ...DEFAULT_WINDOW_VISIBILITY,
            ...Object.fromEntries(
              Object.entries(ui.windowCollapsed).map(([key, collapsed]) => [
                key,
                !collapsed,
              ]),
            ),
          } as WindowVisibilityState);
        }
        if (ui.logFilters) {
          setLogFilters((current) => ({ ...current, ...ui.logFilters }));
        }
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

    scheduleSave({
      debounceTimerRef,
      lastSavedSnapshotRef,
      pendingSaveRef,
      saveInFlightRef,
      snapshot: buildPersistedSnapshot({
        game,
        logFilters,
        windowShown,
        windows,
        worldTimeMs: worldTimeMsRef.current,
      }),
    });
  }, [game, hydrated, logFilters, windowShown, windows, worldTimeMsRef]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      flushPendingSave({
        lastSavedSnapshotRef,
        pendingSaveRef,
        saveInFlightRef,
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearDebounceTimer(debounceTimerRef);
    };
  }, [hydrated]);

  return hydrated;
}
