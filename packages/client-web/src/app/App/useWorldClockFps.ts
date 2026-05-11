import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  type SetStateAction,
  type MutableRefObject,
} from 'react';
import { getWorldTimeMinutesFromTimestamp } from '@realmfall/core/game/worldTime';
import { setWorldClockTime } from './worldClockStore';

interface UseWorldClockFpsOptions {
  initialWorldTimeMs: number;
  paused: boolean;
  worldTimeMsRef: MutableRefObject<number>;
  worldTimeTickRef: MutableRefObject<number | null>;
  lastDisplayedWorldSecondRef: MutableRefObject<number>;
  onWorldMinuteChange?: (worldTimeMinutes: number) => void;
  onWorldSecondChange?: () => void;
}

const WORLD_SECOND_MS = 1_000;

function getDelayUntilNextWorldSecond(worldTimeMs: number) {
  const elapsedIntoSecond = worldTimeMs % WORLD_SECOND_MS;

  return elapsedIntoSecond === 0
    ? WORLD_SECOND_MS
    : WORLD_SECOND_MS - elapsedIntoSecond;
}

export function useWorldClockFps({
  initialWorldTimeMs,
  paused,
  worldTimeMsRef,
  worldTimeTickRef,
  lastDisplayedWorldSecondRef,
  onWorldMinuteChange,
  onWorldSecondChange,
}: UseWorldClockFpsOptions) {
  const lastWorldTimeMinutesRef = useRef(
    getWorldTimeMinutesFromTimestamp(initialWorldTimeMs),
  );
  const timeoutIdRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const rescheduleClockRef = useRef<(timestamp: number) => void>(() => {});
  const syncWorldTime = useEffectEvent((nextWorldTimeMs: number) => {
    const nextWorldTimeMinutes =
      getWorldTimeMinutesFromTimestamp(nextWorldTimeMs);
    setWorldClockTime(nextWorldTimeMs);
    onWorldSecondChange?.();
    if (nextWorldTimeMinutes !== lastWorldTimeMinutesRef.current) {
      lastWorldTimeMinutesRef.current = nextWorldTimeMinutes;
      onWorldMinuteChange?.(nextWorldTimeMinutes);
    }
  });

  useEffect(() => {
    setWorldClockTime(initialWorldTimeMs);
  }, [initialWorldTimeMs]);

  const syncElapsedWorldTime = useEffectEvent((timestamp: number) => {
    const lastTick = worldTimeTickRef.current;

    if (lastTick == null) {
      worldTimeTickRef.current = timestamp;
      return;
    }

    worldTimeMsRef.current += timestamp - lastTick;
    worldTimeTickRef.current = timestamp;
  });

  const syncDisplayedWorldSecond = useEffectEvent(() => {
    const displayedWorldSecond = Math.floor(
      worldTimeMsRef.current / WORLD_SECOND_MS,
    );

    if (displayedWorldSecond === lastDisplayedWorldSecondRef.current) {
      return;
    }

    lastDisplayedWorldSecondRef.current = displayedWorldSecond;
    syncWorldTime(worldTimeMsRef.current);
  });

  useEffect(() => {
    const clearPendingTick = () => {
      const timeoutId = timeoutIdRef.current;

      if (timeoutId == null) {
        return;
      }

      window.clearTimeout(timeoutId);
      timeoutIdRef.current = null;
    };

    const scheduleNextTick = () => {
      clearPendingTick();

      if (!runningRef.current) {
        return;
      }

      const delayMs = getDelayUntilNextWorldSecond(worldTimeMsRef.current);
      timeoutIdRef.current = window.setTimeout(() => {
        if (!runningRef.current) {
          return;
        }

        syncElapsedWorldTime(Date.now());
        syncDisplayedWorldSecond();
        scheduleNextTick();
      }, delayMs);
    };

    const stopClock = () => {
      clearPendingTick();

      if (runningRef.current) {
        syncElapsedWorldTime(Date.now());
      }

      runningRef.current = false;
      worldTimeTickRef.current = null;
    };

    const startClock = () => {
      if (
        runningRef.current ||
        paused ||
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      runningRef.current = true;
      worldTimeTickRef.current = Date.now();
      scheduleNextTick();
    };

    rescheduleClockRef.current = (timestamp: number) => {
      if (
        !runningRef.current ||
        paused ||
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      worldTimeTickRef.current = timestamp;
      scheduleNextTick();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopClock();
        return;
      }

      startClock();
    };

    if (!paused) {
      startClock();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      rescheduleClockRef.current = () => {};
      stopClock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastDisplayedWorldSecondRef, paused, worldTimeMsRef, worldTimeTickRef]);

  const setWorldTimeMs = useCallback(
    (nextWorldTimeMs: SetStateAction<number>) => {
      const now = Date.now();

      if (runningRef.current && worldTimeTickRef.current != null) {
        syncElapsedWorldTime(now);
      }

      const resolvedWorldTimeMs =
        typeof nextWorldTimeMs === 'function'
          ? nextWorldTimeMs(worldTimeMsRef.current)
          : nextWorldTimeMs;
      worldTimeMsRef.current = resolvedWorldTimeMs;
      lastDisplayedWorldSecondRef.current = Math.floor(
        resolvedWorldTimeMs / WORLD_SECOND_MS,
      );
      lastWorldTimeMinutesRef.current =
        getWorldTimeMinutesFromTimestamp(resolvedWorldTimeMs);
      setWorldClockTime(resolvedWorldTimeMs);
      rescheduleClockRef.current(now);
    },
    [lastDisplayedWorldSecondRef, worldTimeMsRef, worldTimeTickRef],
  );

  return {
    setWorldTimeMs,
  };
}
