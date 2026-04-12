import {
  useEffect,
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
  saveEncryptedState,
} from '../../persistence/storage';
import { getWorldTimeMinutesFromTimestamp } from '../../ui/world/timeOfDay';
import {
  DEFAULT_WINDOWS,
  DEFAULT_WINDOW_VISIBILITY,
  type WindowPositions,
  type WindowVisibilityState,
} from '../constants';
import { normalizeLoadedGame } from '../normalize';
import type { PersistedUiState } from './types';

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
  lastDisplayedWorldMinuteRef: MutableRefObject<number>;
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
  lastDisplayedWorldMinuteRef,
}: UseAppPersistenceOptions) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;

    void loadEncryptedState().then((saved) => {
      if (!alive) return;

      if (saved?.game) {
        const loadedGame = normalizeLoadedGame(saved.game as GameState);
        worldTimeMsRef.current = loadedGame.worldTimeMs;
        worldTimeTickRef.current = null;
        lastDisplayedWorldMinuteRef.current = Math.floor(
          getWorldTimeMinutesFromTimestamp(loadedGame.worldTimeMs),
        );
        setWorldTimeMs(loadedGame.worldTimeMs);
        setGame({
          ...loadedGame,
          logSequence: 3,
          logs: createFreshLogs(loadedGame.seed),
        });
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
    lastDisplayedWorldMinuteRef,
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
    void saveEncryptedState({
      game: { ...game, worldTimeMs: worldTimeMsRef.current, logs: [] },
      ui: { windows, windowShown, logFilters },
    });
  }, [game, hydrated, logFilters, windowShown, windows, worldTimeMsRef]);

  useEffect(() => {
    if (!hydrated) return;

    const interval = window.setInterval(() => {
      void saveEncryptedState({
        game: {
          ...gameRef.current,
          worldTimeMs: worldTimeMsRef.current,
          logs: [],
        },
        ui: { windows, windowShown, logFilters },
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [gameRef, hydrated, logFilters, windowShown, windows, worldTimeMsRef]);

  return hydrated;
}
