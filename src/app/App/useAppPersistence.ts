import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { createFreshLogsAtTime } from '../../game/logs';
import type { GameState, LogKind } from '../../game/stateTypes';
import { loadEncryptedState } from '../../persistence/storage';
import { type WindowPositions, type WindowVisibilityState } from '../constants';
import {
  normalizeLoadedGame,
  normalizePersistedUiState,
  normalizeSavedUiItem,
} from '../normalize';
import { normalizeActionBarSlots, type ActionBarSlots } from './actionBar';
import {
  buildPersistedSegments,
  buildPersistedSnapshot,
  getDirtySegments,
  serializeSegments,
  type DirtySaveSegments,
  type LatestSaveInputs,
  type SerializedSaveSegments,
} from './persistence/saveSegments';
import {
  AUTOSAVE_INTERVAL_MS,
  clearDebounceSchedule,
  clearIdleSave,
  enqueuePersistSnapshot,
  scheduleIdleSave,
  scheduleSave,
} from './persistence/saveScheduler';

interface UseAppPersistenceOptions {
  game: GameState;
  gameRef: MutableRefObject<GameState>;
  logFilters: Record<LogKind, boolean>;
  actionBarSlots: ActionBarSlots;
  setGame: Dispatch<SetStateAction<GameState>>;
  setLogFilters: Dispatch<SetStateAction<Record<LogKind, boolean>>>;
  setActionBarSlots: Dispatch<SetStateAction<ActionBarSlots>>;
  setWindows: Dispatch<SetStateAction<WindowPositions>>;
  setWindowShown: Dispatch<SetStateAction<WindowVisibilityState>>;
  setWorldTimeMs: Dispatch<SetStateAction<number>>;
  windows: WindowPositions;
  windowShown: WindowVisibilityState;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
}

export function useAppPersistence({
  actionBarSlots,
  game,
  gameRef,
  logFilters,
  setActionBarSlots,
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
    actionBarSlots,
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
  const idleSaveRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;

      const snapshotUi = normalizePersistedUiState(saved?.ui);
      const hydratedWindows = snapshotUi.windows;
      const hydratedWindowShown = snapshotUi.windowShown;
      const hydratedLogFilters = snapshotUi.logFilters;
      const hydratedActionBarSlots = normalizeActionBarSlots(
        snapshotUi.actionBarSlots,
        normalizeSavedUiItem,
      );
      if (saved?.game) {
        const loadedGame = normalizeLoadedGame(saved.game);
        if (loadedGame) {
          worldTimeMsRef.current = loadedGame.worldTimeMs;
          worldTimeTickRef.current = null;
          lastDisplayedWorldSecondRef.current = Math.floor(
            loadedGame.worldTimeMs / 1000,
          );
          setWorldTimeMs(loadedGame.worldTimeMs);
          setGame({
            ...loadedGame,
            logSequence: 3,
            logs: createFreshLogsAtTime(
              loadedGame.seed,
              loadedGame.worldTimeMs,
            ),
          });
          latestInputsRef.current.game = loadedGame;
          latestInputsRef.current.worldTimeMs = loadedGame.worldTimeMs;
        }
      }

      if (saved?.ui) {
        setWindows(hydratedWindows);
        setWindowShown(hydratedWindowShown);
        setLogFilters(hydratedLogFilters);
        setActionBarSlots(hydratedActionBarSlots);
      }

      latestInputsRef.current.actionBarSlots = hydratedActionBarSlots;
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
    setActionBarSlots,
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
      idleSaveRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, [game, hydrated, worldTimeMsRef]);

  useEffect(() => {
    if (!hydrated) return;

    latestInputsRef.current.actionBarSlots = actionBarSlots;
    latestInputsRef.current.logFilters = logFilters;
    latestInputsRef.current.windowShown = windowShown;
    latestInputsRef.current.windows = windows;
    dirtySegmentsRef.current.ui = true;
    scheduleSave({
      debounceDueAtRef,
      debounceTimerRef,
      dirtySegmentsRef,
      idleSaveRef,
      latestInputsRef,
      lastSavedSerializedRef,
      saveInFlightRef,
      saveQueueRef,
    });
  }, [actionBarSlots, hydrated, logFilters, windowShown, windows]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      if (
        debounceDueAtRef.current !== null &&
        debounceDueAtRef.current <= Date.now()
      ) {
        return;
      }

      scheduleIdleSave({
        dirtySegmentsRef,
        idleSaveRef,
        latestInputsRef,
        lastSavedSerializedRef,
        saveInFlightRef,
        saveQueueRef,
      });
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
      clearIdleSave(idleSaveRef);
    };
  }, [hydrated]);

  const persistNow = async () => {
    clearDebounceSchedule(debounceDueAtRef, debounceTimerRef);
    clearIdleSave(idleSaveRef);

    latestInputsRef.current = {
      actionBarSlots,
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
